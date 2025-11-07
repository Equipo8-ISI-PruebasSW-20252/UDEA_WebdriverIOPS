import Page from './page.js'

class TransferPage extends Page {
  get fromAccount () { return $('#fromAccountId'); }
  get toAccount () { return $('#toAccountId'); }
  get amountInput () { return $('#amount'); }
  get transferBtn () { return $('button=Transfer'); }
  get successMessage () { return $('#rightPanel .message'); }
  get errorMessage () { return $('.error'); }

  async open () {
    return super.open('transfer');
  }

  async transfer (fromIndex, toIndex, amount) {
    
    await this.fromAccount.waitForExist({ timeout: 5000 });
    await this.toAccount.waitForExist({ timeout: 5000 });
    
    await browser.waitUntil(async () => {
      const opts = await this.fromAccount.$$('option');
      return Array.isArray(opts) && opts.length > 0;
    }, { timeout: 7000, timeoutMsg: 'From-account options not populated' });

    await browser.waitUntil(async () => {
      const opts = await this.toAccount.$$('option');
      return Array.isArray(opts) && opts.length > 0;
    }, { timeout: 7000, timeoutMsg: 'To-account options not populated' });

    
    const fromOptions = await this.fromAccount.$$('option');
    const toOptions = await this.toAccount.$$('option');
    if (fromIndex < 0 || fromIndex >= fromOptions.length) throw new Error('fromIndex out of range');
    if (toIndex < 0 || toIndex >= toOptions.length) throw new Error('toIndex out of range');

    
    await this.fromAccount.selectByIndex(fromIndex);
    await this.toAccount.selectByIndex(toIndex);
    await this.amountInput.waitForExist({ timeout: 3000 });
    await this.amountInput.setValue(String(amount));

    
    const candidates = [
      'button=Transfer',
      'button[type="submit"]',
      'input[type="submit"]',
      'input[value="Transfer"]',
      '//button[normalize-space() = "Transfer"]',
      '//input[@value="Transfer"]'
    ];

    let btnEl = null;
    for (const sel of candidates) {
      try {
        const el = await $(sel);
        if (await el.isExisting()) {
          btnEl = el;
          break;
        }
      } catch (e) {
        
      }
    }
    if (!btnEl) {
      throw new Error('Transfer button not found on the page');
    }

    
    await btnEl.waitForClickable({ timeout: 7000 });
    await btnEl.click();
  }

  
  async waitForSuccessMessage (timeout = 7000) {
    const candidates = [
      '#rightPanel .message',
      '#rightPanel .success',
      '.message',
      '.success',
      '.info',
      '#rightPanel .content'
    ];
    await browser.waitUntil(async () => {
      
      for (const sel of candidates) {
        try {
          const els = await $$(sel);
          if (Array.isArray(els) && els.length > 0) return true;
        } catch (e) {
          // ignora selectores invalidos
        }
      }

      
      try {
        const bodyText = await browser.execute(() => document.body.innerText || document.body.textContent || '');
        if (typeof bodyText === 'string' && /has been transferred/.test(bodyText)) return true;
      } catch (e) {
        // ignore execute errors
      }

      return false;
    }, { timeout, timeoutMsg: `No success message found using known selectors or page text after ${timeout}ms` });

    
    for (const sel of candidates) {
      try {
        const el = await $(sel);
        if (await el.isExisting()) return el;
      } catch (e) {
        // ignore invalid selectors
      }
    }

    
    try {
      const byText = await $('//*[contains(normalize-space(.), "has been transferred")]');
      if (await byText.isExisting()) return byText;
    } catch (e) {
      // ignore
    }

    
    try {
      const body = await $('body');
      const bodyText = await browser.execute(() => document.body.innerText || document.body.textContent || '');
      if (typeof bodyText === 'string' && /has been transferred/.test(bodyText)) return body;
    } catch (e) {
      // ignore
    }

    
    throw new Error('Success message not found after wait');
  }
}

export default new TransferPage();
