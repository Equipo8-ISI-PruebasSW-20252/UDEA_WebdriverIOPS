Feature: Consulta de Estados

  # 2. Consulta de Estados
  Scenario: Ver todas las cuentas y sus balances
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview
    When I view my accounts overview
    Then I should see a list of accounts
    And each account should show a current balance

  Scenario: Ver detalles de una cuenta
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview
    When I view my accounts overview
    And I click on the account number at index 0
    Then I should see the account details for that account
 
