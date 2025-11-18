Feature: Pagos (Bill Pay)

  Background:
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview

  # 4. Pagos (Billpay)
  Scenario: Confirmación y pago exitoso
    When I prepare a bill payment with:
      | payee   | Demo Telecom |
      | address | Calle 123 #45 |
      | city    | Medellin |
      | state   | ANT |
      | zip     | 050021 |
      | phone   | 3001234567 |
      | account | 13344 |
      | amount  | 25 |
    Then the bill pay payload should include the account and amount
    When I send the bill payment using the Bill Pay form
    Then I should receive a bill payment success response

  Scenario: Mostrar mensaje de error ante datos inválidos
    When I prepare a bill payment with:
      | payee   | Servicio Agua |
      | address | Calle 50 #10 |
      | city    | Bogota |
      | state   | CUN |
      | zip     | 110911 |
      | phone   | 3109998888 |
      | account | 00000 |
      | amount  | -1 |
    Then the bill pay payload should include the account and amount
    When I send the bill payment using the Bill Pay form
    Then I should receive a bill payment error response

