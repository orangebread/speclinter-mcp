Feature: improve readme to include instructions for cross platform

  Scenario: improve readme to include instructions for cross platform - Happy Path
    Given the system is ready
    When improve readme to include instructions for cross platform usage and example mcp json for users to copy paste into their own projects
    Then the acceptance criteria are met

  Scenario: improve readme to include instructions for cross platform - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
