import Page from './page.js';

class LoanPage extends Page {
  get amountSelectors () {
    return ['#amount', 'input[name="amount"]'];
  }

  get downPaymentSelectors () {
    return ['#downPayment', 'input[name="downPayment"]'];
  }

  get fromAccountSelectors () {
    return ['#fromAccountId', 'select[name="fromAccountId"]'];
  }

  get submitSelectors () {
    return [
      '//input[@value="Apply Now"]',
      '//button[normalize-space()="Apply Now"]',
      'input[type="submit"]',
      'button[type="submit"]'
    ];
  }

  get resultSelectors () {
    return [
      '#loanStatus',
      '#responseMessage',
      '#loanRequestResult',
      '#rightPanel .title',
      '//p[contains(@id,"loan") or contains(@class,"loan")]'
    ];
  }

  async open () {
    return super.open('requestloan');
  }

  async navigateFromMenu () {
    const link = await $('=Request Loan');
    await link.waitForClickable({ timeout: 5000 });
    await link.click();
    await this.waitForForm();
  }

  async waitForForm () {
    const allSelectors = [...this.amountSelectors, ...this.downPaymentSelectors];
    await browser.waitUntil(async () => {
      for (const sel of allSelectors) {
        const el = await $(sel);
        if (await el.isExisting()) return true;
      }
      return false;
    }, { timeout: 7000, timeoutMsg: 'Loan form did not render in time' });
  }

  async getFirstExisting (selectors, friendlyName) {
    for (const sel of selectors) {
      const el = await $(sel);
      if (await el.isExisting()) return el;
    }
    throw new Error(`Element for ${friendlyName} not found on Request Loan page`);
  }

  async submitLoan (amount, downPayment, fromAccountIndex = 0) {
    await this.waitForForm();
    const amountInput = await this.getFirstExisting(this.amountSelectors, 'amount');
    const downPaymentInput = await this.getFirstExisting(this.downPaymentSelectors, 'down payment');
    const fromAccountSelect = await this.getFirstExisting(this.fromAccountSelectors, 'from account');

    await amountInput.clearValue();
    await amountInput.setValue(String(amount));
    await downPaymentInput.clearValue();
    await downPaymentInput.setValue(String(downPayment));

    await browser.waitUntil(async () => {
      const opts = await fromAccountSelect.$$('option');
      return opts && opts.length > 0;
    }, { timeout: 7000, timeoutMsg: 'No deposit accounts available for loan request' });

    await fromAccountSelect.selectByIndex(Number(fromAccountIndex));

    for (const sel of this.submitSelectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        await el.waitForClickable({ timeout: 5000 });
        await el.click();
        return;
      }
    }
    throw new Error('Loan submit button not found');
  }

  async waitForDecision (timeout = 8000) {
    await browser.waitUntil(async () => {
      for (const sel of this.resultSelectors) {
        const el = await $(sel);
        if (await el.isExisting()) {
          const text = await el.getText();
          if (text && text.trim().length > 0) return true;
        }
      }
      return false;
    }, { timeout, timeoutMsg: 'Loan decision not displayed' });
  }

  async getDecisionText () {
    for (const sel of this.resultSelectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        const text = await el.getText();
        if (text && text.trim().length > 0) return text.trim();
      }
    }
    return '';
  }

  async isApproved () {
    const text = await this.getDecisionText();
    return /approved|accepted/i.test(text);
  }

  async getDenialReason () {
    const text = await this.getDecisionText();
    if (/denied|rejected|unable|Declined/i.test(text)) {
      return text;
    }
    const reasonSelectors = ['#loanStatus', '#responseMessage', '.error'];
    for (const sel of reasonSelectors) {
      const el = await $(sel);
      if (await el.isExisting()) {
        const content = await el.getText();
        if (content && content.trim().length) return content.trim();
      }
    }
    return '';
  }
}

export default new LoanPage();

