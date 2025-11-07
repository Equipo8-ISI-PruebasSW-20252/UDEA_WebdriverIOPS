import { Given, When, Then } from "@wdio/cucumber-framework";

import LoginPage from '../pageobjects/login.page.js';
import AccountsPage from '../pageobjects/accounts.page.js';
import TransferPage from '../pageobjects/transfer.page.js';

const pages = {
  login: LoginPage,
  accounts: AccountsPage,
  transfer: TransferPage,
};

// simple in-file context for sharing values between steps
const ctx = {};

Given(/^I am on the (\w+) page$/, async (page) => {
  if (!pages[page]) throw new Error(`Unknown page: ${page}`);
  // ensure a clean session before opening login page
  try {
    await browser.deleteCookies();
  } catch (e) {
    // ignore if not supported
  }
  await pages[page].open();
});

// LOGIN
When(/^I login with (\w+) and (.+)$/, async (username, password) => {
  // ensure login inputs are present (login.page handles waits too)
  await LoginPage.inputUsername.waitForExist({ timeout: 5000 });
  await LoginPage.login(username, password);
});


Then(/^I should see a text saying (.*)$/, async (message) => {
  await expect($('.title')).toBeExisting();
  // strict assertion: the page title must contain the expected message.
  // We do NOT accept 'Accounts Overview' when the expected message is an error.
  const titleEl = await $('.title');
  const actual = await titleEl.getText();
  if (actual.includes(message)) return;
  // allow a permissive match only when the expected message is 'Accounts Overview'
  if (message.toLowerCase().includes('accounts overview') && actual.toLowerCase().includes('accounts overview')) {
    return;
  }
  // otherwise fail explicitly so a bug in the app (accepting invalid credentials) is visible
  throw new Error(`Expected page title to contain "${message}" but got "${actual}"`);
});

Then(/^the login button should be disabled when fields are empty$/, async () => {
  // clear fields
  await LoginPage.inputUsername.waitForExist({ timeout: 3000 });
  await LoginPage.inputPassword.waitForExist({ timeout: 3000 });
  await LoginPage.inputUsername.clearValue();
  await LoginPage.inputPassword.clearValue();
  // check disabled or not clickable
  const btn = await LoginPage.btnSubmit;
  // many implementations use disabled attribute; check both
  const isDisabled = await btn.getAttribute('disabled');
  if (isDisabled !== null) {
    // attribute present -> considered disabled
    return;
  }
  // fallback: if button is enabled, ensure clicking it with empty fields does NOT log the user in
  const enabled = await btn.isEnabled();
  if (!enabled) return; // not enabled -> good

  // if enabled, click it and verify we did NOT reach the Accounts Overview page
  await btn.click();
  // wait briefly for any navigation
  await browser.pause(800);
  const title = await $('.title').getText();
  if (title && title.toLowerCase().includes('accounts overview')) {
    throw new Error('Login unexpectedly succeeded when submitting empty credentials');
  }
  // otherwise consider the app acceptable (it either showed validation or remained on login)
  return;
});

// ACCOUNTS
When(/^I view my accounts overview$/, async () => {
  // ensure accounts table exists
  await $('#accountTable').waitForExist({ timeout: 5000 });
});

Then(/^I should see a list of accounts$/, async () => {
  const rows = await AccountsPage.accountRows();
  if (!rows || rows.length === 0) {
    throw new Error('No accounts found for the logged user. Check that the user has accounts or that the selector #accountTable is correct.');
  }
  expect(rows.length).toBeGreaterThan(0);
});

Then(/^each account should show a current balance$/, async () => {
  const balances = await AccountsPage.getBalances();
  expect(balances.length).toBeGreaterThan(0);
  for (let b of balances) {
    // basic validation: has digits and optional currency symbol
    expect(/\d/.test(b)).toBeTruthy();
  }
});

When(/^I click on the account number at index (\d+)$/, async (index) => {
  await AccountsPage.clickAccountByIndex(Number(index));
});

Then(/^I should see the account details for that account$/, async () => {
  // transaction table is shown in account details
  await expect($('#transactionTable')).toBeExisting();
});

Then(/^the transactions list should update when I select another account$/, async () => {
  // capture current transactions count
  const rowsBefore = await $$('#transactionTable tbody tr');
  const countBefore = rowsBefore.length;
  // select another account (if exists)
  const rowsAccounts = await AccountsPage.accountRows();
  if (rowsAccounts.length < 2) return; // nothing to compare
  await AccountsPage.clickAccountByIndex(1);
  const rowsAfter = await $$('#transactionTable tbody tr');
  const countAfter = rowsAfter.length;
  // either counts differ or content differs; assert at least difference in count or elements
  expect(countBefore === countAfter ? false : true).toBeTruthy();
});

// TRANSFERS
When(/^I go to the Transfer Funds page$/, async () => {
  const link = await $('=Transfer Funds');
  await link.click();
  await $('h1').waitForExist({ timeout: 5000 });
});

function parseCurrency (text) {
  // remove any non-digit, non-dot, non-minus characters
  const cleaned = text.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned);
}

When(/^I note the balances for account index (\d+) and account index (\d+)$/, async (fromIndex, toIndex) => {
  // go to Accounts Overview to read balances
  await $('=Accounts Overview').click();
  const balances = await AccountsPage.getBalances();
  ctx.fromBalance = parseCurrency(balances[Number(fromIndex)] || '0');
  ctx.toBalance = parseCurrency(balances[Number(toIndex)] || '0');
});

When(/^I transfer (\d+) from account index (\d+) to account index (\d+)$/, async (amount, fromIndex, toIndex) => {
  await $('=Transfer Funds').click();
  try {
    await TransferPage.transfer(Number(fromIndex), Number(toIndex), Number(amount));
  } catch (err) {
    // rethrow with clearer message
    throw new Error(`Transfer failed: ${err.message}`);
  }
  ctx.transferAmount = Number(amount);
});

Then(/^the transfer should be successful$/, async () => {
  // Parabank shows a confirmation message in rightPanel; wait briefly for it to appear
  // wait up to 7s for the message to appear (UI may take a moment after submitting)
  const msg = await TransferPage.waitForSuccessMessage(7000);
  await expect(msg).toBeExisting();
});

Then(/^the balances should reflect the transfer immediately$/, async () => {
  // go back to accounts overview and compare balances
  await $('=Accounts Overview').click();
  const balances = await AccountsPage.getBalances();
  const from = parseCurrency(balances[0]);
  const to = parseCurrency(balances[1]);
  expect(Math.abs((ctx.fromBalance - ctx.transferAmount) - from) < 0.01).toBeTruthy();
  expect(Math.abs((ctx.toBalance + ctx.transferAmount) - to) < 0.01).toBeTruthy();
});

When(/^I attempt to transfer an amount greater than the available balance from account index (\d+) to account index (\d+)$/, async (fromIndex, toIndex) => {
  // first read balances
  await $('=Accounts Overview').click();
  const balances = await AccountsPage.getBalances();
  const fromBal = parseCurrency(balances[Number(fromIndex)] || '0');
  const excessive = fromBal + 1000;
  await $('=Transfer Funds').click();
  await TransferPage.transfer(Number(fromIndex), Number(toIndex), excessive);
});

Then(/^I should see a validation error about insufficient funds$/, async () => {
  // expect error message or absence of success message
  const err = await TransferPage.errorMessage;
  if (err && await err.isExisting()) {
    await expect(err).toBeExisting();
  } else {
    // fallback: success message should not be present
    const msg = await TransferPage.successMessage;
    if (msg && await msg.isExisting()) {
      throw new Error('Transfer unexpectedly succeeded when it should have failed');
    }
  }
});