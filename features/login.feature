Feature: Login

  # 1. Login
  Scenario Outline: Usuario puede iniciar sesión con credenciales válidas o ver error con inválidas
    Given I am on the login page
    When I login with <username> and <password>
    Then I should see a text saying <message>

    Examples:
      | username      | password | message             |
      | invalidUser213   | password21 | Error!              |
      | john          | demo     | Accounts Overview   |

  Scenario: El botón de login está deshabilitado si los campos están vacíos
    Given I am on the login page
    Then the login button should be disabled when fields are empty

