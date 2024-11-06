// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

function addDeprecatedToModuleName(content: string, fileType: string): string {
  switch (fileType) {
    case "elixir":
      // This regex matches "defmodule" followed by a module name (with possible dots)
      // and captures everything up to the "do" keyword
      const moduleRegex = /defmodule\s+([A-Z][A-Za-z0-9_.]*)\s+do/g;

      return content.replace(moduleRegex, (match, moduleName) => {
        // Split on dots to handle nested modules
        const parts = moduleName.split(".");
        // Add "Deprecated" to the last part
        parts[parts.length - 1] = `${parts[parts.length - 1]}Deprecated`;
        // Reconstruct the module definition
        return `defmodule ${parts.join(".")} do`;
      });

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "deprecate-module.deprecateFile",
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          return;
        }

        const filePath = uri.fsPath;
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);

        // Determine the new file name based on the pattern
        let newFileName: string;

        if (fileName.endsWith("_test.exs")) {
          const match = fileName.match(/^(.+)_test\.exs$/);
          if (match) {
            const prefix = match[1];
            newFileName = `${prefix}_deprecated_test.exs`;
          } else {
            throw new Error("Invalid test file name pattern");
          }
        } else if (fileName.endsWith(".ex")) {
          const baseName = path.basename(fileName, ".ex");
          newFileName = `${baseName}_deprecated.ex`;
        } else {
          throw new Error(
            "Unsupported file type. Only .ex and *_test.exs files are supported."
          );
        }

        const newFilePath = path.join(dirPath, newFileName);

        // Check if deprecated file already exists
        if (fs.existsSync(newFilePath)) {
          const response = await vscode.window.showWarningMessage(
            `${newFileName} already exists. Do you want to overwrite it?`,
            "Yes",
            "No"
          );
          if (response !== "Yes") {
            return;
          }
        }

        // Read the file content and update module name
        const content = fs.readFileSync(filePath, "utf8");
        const updatedContent = addDeprecatedToModuleName(content, "elixir");

        // Write the modified content to the new file
        fs.writeFileSync(newFilePath, updatedContent);

        vscode.window.showInformationMessage(
          `Created deprecated copy: ${newFileName}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error creating deprecated copy: ${error}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
