import Page from './page.js';

class LoginPage extends Page {
   
    get inputUsername () {
        
        return $('#loginPanel input[name="username"]') || $('#loginPanel input#username');
    }

    get inputPassword () {
        return $('#loginPanel input[name="password"]') || $('#loginPanel input#password');
    }

    get btnSubmit () {
        
        return $('#loginPanel input[type="submit"]') || $('#loginPanel button[type="submit"]');
    }
   
    
    async login (username, password) {
        
        const userSelectors = [
            '#loginPanel input[name="username"]',
            '#loginPanel input#username',
            '#loginPanel > form > div:nth-child(2) > input'
        ];
        const passSelectors = [
            '#loginPanel input[name="password"]',
            '#loginPanel input#password',
            '#loginPanel > form > div:nth-child(4) > input'
        ];
        const submitSelectors = [
            '#loginPanel input[type="submit"]',
            '#loginPanel button[type="submit"]',
            '#loginPanel > form > div:nth-child(5) > input'
        ];

        
        await browser.waitUntil(async () => {
            for (const s of userSelectors) {
                if (await $(s).isExisting()) return true;
            }
            return false;
        }, { timeout: 6000, timeoutMsg: 'Login username input not found' });

        
        let userEl;
        for (const s of userSelectors) {
            const el = await $(s);
            if (await el.isExisting()) { userEl = el; break; }
        }
        let passEl;
        for (const s of passSelectors) {
            const el = await $(s);
            if (await el.isExisting()) { passEl = el; break; }
        }
        let submitEl;
        for (const s of submitSelectors) {
            const el = await $(s);
            if (await el.isExisting()) { submitEl = el; break; }
        }

        if (!userEl || !passEl || !submitEl) {
            throw new Error('Could not locate login controls (username/password/submit) on the page');
        }

        await userEl.clearValue();
        await userEl.setValue(username);
        await passEl.clearValue();
        await passEl.setValue(password);
        await submitEl.click();
    }


    open () {
        return super.open('index');
    }
}

export default new LoginPage();
