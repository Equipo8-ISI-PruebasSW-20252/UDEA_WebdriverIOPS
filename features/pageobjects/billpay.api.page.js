import Page from './page.js';

class BillPayApiPage extends Page {
  baseUrl = 'https://parabank.parasoft.com/parabank/services/bank';

  defaultPayload = {
    address: {
      street: 'Calle 123',
      city: 'Medellin',
      state: 'Antioquia',
      zipCode: '050021',
    },
    name: 'Pago automatizado',
    phoneNumber: '3001234567',
    accountNumber: '13344',
  };

  async payBill ({ amount, accountId, overrides = {} }) {
    if (!amount || !accountId) {
      throw new Error('Both amount and accountId are required to send a bill payment');
    }
    const query = new URLSearchParams({
      accountId: String(accountId),
      amount: String(amount),
    }).toString();

    const payload = {
      ...this.defaultPayload,
      ...overrides,
    };

    const response = await browser.call(async () => {
      return await fetch(`${this.baseUrl}/billpay?${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    const body = await response.text();
    return {
      status: response.status,
      body,
      payloadSent: payload,
    };
  }
}

export default new BillPayApiPage();

