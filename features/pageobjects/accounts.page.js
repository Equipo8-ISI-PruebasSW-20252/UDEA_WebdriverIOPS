import Page from './page.js'

class AccountsPage extends Page {
  async accountRows () {
    
    const table = $('#accountTable');
    
    if (await table.isExisting()) {
      
      await browser.waitUntil(async () => {
        const rows = await $$('#accountTable tbody tr');
        return rows && rows.length > 0;
      }, { timeout: 7000, timeoutMsg: 'No account rows appeared inside #accountTable' });
      return $$('#accountTable tbody tr');
    }
    
    const fallbackRows = await $$('#rightPanel table tbody tr');
    if (fallbackRows && fallbackRows.length) return fallbackRows;
    
    return $$('table tbody tr');
  }

  
  async clickAccountByIndex (index) {
    
    await browser.waitUntil(async () => {
      const rows = await this.accountRows();
      return rows && rows.length > 0;
    }, { timeout: 7000, timeoutMsg: 'No account rows appeared within timeout' });

    const rows = await this.accountRows();
    if (!rows || rows.length === 0) throw new Error('No accounts found');
    if (index < 0 || index >= rows.length) throw new Error(`Account index ${index} out of range`);
    
    let link = await rows[index].$('a');
    if (!link || !await link.isExisting()) {
      link = await rows[index].$('td a');
    }
    if (!link || !await link.isExisting()) {
     
      link = await rows[index].$('td:nth-child(1) a');
    }
   
    let button = null;
    if (!link || !await link.isExisting()) {
      button = await rows[index].$('button');
      if (!button || !await button.isExisting()) {
        button = await rows[index].$('input[type="button"]');
      }
    }

    if (link && await link.isExisting()) {
      await link.waitForClickable({ timeout: 3000 });
      await link.click();
    } else if (button && await button.isExisting()) {
      await button.waitForClickable({ timeout: 3000 }).catch(()=>{});
      await button.click().catch(()=>{});
    } else {
      
      const firstCell = await rows[index].$('td');
      if (firstCell && await firstCell.isExisting()) {
        try {
          await firstCell.waitForClickable({ timeout: 2000 });
          await firstCell.click();
        } catch (e) {
          
          await rows[index].click();
        }
      } else {
        try {
          await rows[index].click();
        } catch (e) {
          throw new Error('Account link not found inside the selected row');
        }
      }
    }
    
    await browser.waitUntil(async () => {
      return (await $('#transactionTable').isExisting()) || ((await $('h1')).isExisting() && (await $('h1').getText()).toLowerCase().includes('account'));
    }, { timeout: 5000, timeoutMsg: 'Account details did not appear after clicking account link' });
  }

  async getBalances () {
    
    await browser.waitUntil(async () => {
      const rows = await this.accountRows();
      return rows && rows.length > 0;
    }, { timeout: 7000, timeoutMsg: 'No account rows found when reading balances' });
    const rows = await this.accountRows();
    const balances = [];
    for (let r of rows) {
      
      let balEl = await r.$('td:nth-child(2)');
      if (!balEl || !await balEl.isExisting()) {
        balEl = await r.$('.balance');
      }
      if (!balEl || !await balEl.isExisting()) {
        balances.push('0');
        continue;
      }
      const text = await balEl.getText();
      balances.push(text ? text.trim() : '0');
    }
    return balances;
  }

  async open () {
    return super.open('overview');
  }
}

export default new AccountsPage();
