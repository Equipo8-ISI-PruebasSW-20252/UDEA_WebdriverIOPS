import Page from './page.js';

class BillPayPage extends Page {
  get formSelectors () {
    return ['#billpayForm', 'form[action*="billpay"]', '#billpay'];
  }

  get payeeNameSelectors () {
    return ['#payee\\\\.name', 'input[name="payee.name"]'];
  }

  get addressSelectors () {
    return ['#payee\\\\.address\\.street', 'input[name="payee.address.street"]'];
  }

  get citySelectors () {
    return ['#payee\\\\.address\\.city', 'input[name="payee.address.city"]'];
  }

  get stateSelectors () {
    return ['#payee\\\\.address\\.state', 'input[name="payee.address.state"]'];
  }

  get zipSelectors () {
    return ['#payee\\\\.address\\.zipCode', 'input[name="payee.address.zipCode"]'];
  }

  get phoneSelectors () {
    return ['#payee\\\\.phoneNumber', 'input[name="payee.phoneNumber"]'];
  }

  get accountSelectors () {
    return ['#payee\\\\.accountNumber', 'input[name="payee.accountNumber"]'];
  }

  get verifyAccountSelectors () {
    return ['#verifyAccount', 'input[name="verifyAccount"]'];
  }

  get amountSelectors () {
    return ['#amount', 'input[name="amount"]'];
  }

  get fromAccountSelectors () {
    return ['#fromAccountId', 'select[name="fromAccountId"]'];
  }

  get confirmationMessageSelectors () {
    return [
      '#billpayResult .title',
      '#rightPanel .title',
      '#rightPanel .message',
      '.title=Bill Payment Complete'
    ];
  }

  get errorSelectors () {
    return ['#billpayResult .error', '.error', '#rightPanel .error', '#billpayResult .ng-binding'];
  }

  async open () {
    return super.open('billpay');
  }

  async navigateFromMenu () {
    const link = await $('=Bill Pay');
    await link.waitForClickable({ timeout: 5000 });
    await link.click();
    await this.waitForForm();
  }

  async waitForForm () {
    await browser.waitUntil(async () => {
      for (const sel of this.formSelectors) {
        const el = await $(sel);
        if (await el.isExisting()) return true;
      }
      return false;
    }, { timeout: 7000, timeoutMsg: 'Bill Pay form did not appear' });
  }

  async getFirstExisting (selectors, friendlyName) {
    for (const sel of selectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        return el;
      }
    }
    throw new Error(`Element for ${friendlyName} not found on Bill Pay page`);
  }

  async setInputValueViaDOM (selectors, value) {
    const stringValue = String(value ?? '');
    const applied = await browser.execute((sels, val) => {
      const setVal = (el, newVal) => {
        if (!el) return false;
        try {
          el.removeAttribute && el.removeAttribute('readonly');
          el.focus && el.focus();
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.value = newVal;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {
          el.value = newVal;
        }
        return true;
      };
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (el && setVal(el, val)) {
          return true;
        }
      }
      return false;
    }, selectors, stringValue);
    if (!applied) {
      const element = await this.getFirstExisting(selectors, 'input field');
      await element.waitForDisplayed({ timeout: 4000 });
      await element.waitForEnabled({ timeout: 4000 });
      await element.scrollIntoView({ block: 'center', inline: 'center' });
      await element.click();
      await element.clearValue().catch(() => {});
      await element.setValue(stringValue);
    }
  }

  async populateAccountOptions (fallbackAccounts = []) {
    if (!fallbackAccounts || !fallbackAccounts.length) return false;
    return await browser.execute((selectors, accounts) => {
      const createOptions = (selectEl, accountsList) => {
        if (!selectEl) return false;
        selectEl.innerHTML = '';
        accountsList.forEach((acc, idx) => {
          const option = document.createElement('option');
          option.value = acc;
          option.textContent = acc;
          option.dataset.generated = 'true';
          selectEl.appendChild(option);
        });
        return selectEl.options && selectEl.options.length > 0;
      };
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && createOptions(el, accounts)) {
          return true;
        }
      }
      return false;
    }, this.fromAccountSelectors, fallbackAccounts);
  }

  async fillBillPayForm (data, fallbackAccounts = []) {
    await this.waitForForm();

    const entries = [
      { key: 'payee', selectors: this.payeeNameSelectors },
      { key: 'address', selectors: this.addressSelectors },
      { key: 'city', selectors: this.citySelectors },
      { key: 'state', selectors: this.stateSelectors },
      { key: 'zip', selectors: this.zipSelectors },
      { key: 'phone', selectors: this.phoneSelectors },
      { key: 'account', selectors: this.accountSelectors },
      { key: 'verifyAccount', selectors: this.verifyAccountSelectors },
      { key: 'amount', selectors: this.amountSelectors }
    ];

    for (const entry of entries) {
      if (data[entry.key] === undefined) continue;
      await this.setInputValueViaDOM(entry.selectors, data[entry.key]);
    }

    if (data.fromAccountIndex !== undefined) {
      const select = await this.getFirstExisting(this.fromAccountSelectors, 'fromAccount');
      await select.waitForExist({ timeout: 4000 });
      let attemptedPopulate = false;
      await browser.waitUntil(async () => {
        const opts = await select.$$('option');
        if (opts && opts.length > 0) return true;
        if (!attemptedPopulate && fallbackAccounts && fallbackAccounts.length) {
          attemptedPopulate = true;
          await this.populateAccountOptions(fallbackAccounts);
        }
        return false;
      }, { timeout: 7000, timeoutMsg: 'No source accounts available for bill pay' });
      await select.selectByIndex(Number(data.fromAccountIndex));
    }
  }

  async formSnapshot () {
    const snapshot = {};
    const map = {
      payee: this.payeeNameSelectors,
      address: this.addressSelectors,
      city: this.citySelectors,
      state: this.stateSelectors,
      zip: this.zipSelectors,
      phone: this.phoneSelectors,
      account: this.accountSelectors,
      verifyAccount: this.verifyAccountSelectors,
      amount: this.amountSelectors
    };
    for (const key of Object.keys(map)) {
      try {
        const el = await this.getFirstExisting(map[key], key);
        snapshot[key] = (await el.getValue()) || '';
      } catch (err) {
        snapshot[key] = '';
      }
    }
    return snapshot;
  }

  async submit () {
    const selectors = [
      '//input[@value="Send Payment"]',
      '//button[normalize-space()="Send Payment"]',
      'input[type="submit"]',
      'button[type="submit"]'
    ];
    for (const sel of selectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        await el.waitForClickable({ timeout: 5000 });
        await el.click();
        return;
      }
    }
    throw new Error('Bill Pay submit button not found');
  }

  async waitForSuccessMessage (timeout = 8000) {
    await browser.waitUntil(async () => {
      for (const sel of this.confirmationMessageSelectors) {
        const el = await $(sel);
        if (await el.isExisting()) return true;
      }
      return false;
    }, { timeout, timeoutMsg: 'Bill Pay success message not found' });

    for (const sel of this.confirmationMessageSelectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        return await el.getText();
      }
    }
    return '';
  }

  async waitForErrorMessage (timeout = 7000) {
    await browser.waitUntil(async () => {
      for (const sel of this.errorSelectors) {
        const el = await $(sel);
        if (await el.isExisting()) return true;
      }
      return false;
    }, { timeout, timeoutMsg: 'Bill Pay error message not found' });

    for (const sel of this.errorSelectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        return await el.getText();
      }
    }
    return '';
  }
}

export default new BillPayPage();

