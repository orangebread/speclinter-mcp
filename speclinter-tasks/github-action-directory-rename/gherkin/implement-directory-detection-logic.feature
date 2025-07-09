Feature: Implement Directory Detection Logic

  Scenario: Implement Directory Detection Logic - Happy Path
    Given the system is ready
    When Add steps to detect if .speclinter and speclinter-tasks directories exist
    Then the acceptance criteria are met

  Scenario: Implement Directory Detection Logic - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
