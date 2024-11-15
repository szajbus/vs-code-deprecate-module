// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

function camelize(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

function addDeprecatedToModuleName(
  content: string,
  fileType: string,
  label?: string
): string {
  const deprecatedSuffix = label
    ? `Deprecated${camelize(label).charAt(0).toUpperCase()}${camelize(
        label
      ).slice(1)}`
    : "Deprecated";

  switch (fileType) {
    case "elixir":
      const moduleRegex = /defmodule\s+([A-Z][A-Za-z0-9_.]*)\s+do/g;
      return content.replace(moduleRegex, (match, moduleName) => {
        const parts = moduleName.split(".");
        parts[parts.length - 1] = `${
          parts[parts.length - 1]
        }${deprecatedSuffix}`;
        return `defmodule ${parts.join(".")} do`;
      });

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function copyToDeprecatedFile(
  filePath: string,
  label?: string
): Promise<{ newFilePath: string; newFileName: string }> {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const labelSuffix = label
    ? `_deprecated_${label.toLowerCase()}`
    : "_deprecated";

  // Determine the new file name based on the pattern
  let newFileName: string;
  if (fileName.endsWith("_test.exs")) {
    const match = fileName.match(/^(.+)_test\.exs$/);
    if (match) {
      const prefix = match[1];
      newFileName = `${prefix}${labelSuffix}_test.exs`;
    } else {
      throw new Error("Invalid test file name pattern");
    }
  } else if (fileName.endsWith(".ex")) {
    const baseName = path.basename(fileName, ".ex");
    newFileName = `${baseName}${labelSuffix}.ex`;
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
      throw new Error("Operation cancelled by user");
    }
  }

  return { newFilePath, newFileName };
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let deprecateModule = vscode.commands.registerCommand(
    "deprecate-module.deprecateModule",
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          return;
        }

        const filePath = uri.fsPath;
        const { newFilePath, newFileName } = await copyToDeprecatedFile(
          filePath
        );

        const content = fs.readFileSync(filePath, "utf8");
        const updatedContent = addDeprecatedToModuleName(content, "elixir");

        fs.writeFileSync(newFilePath, updatedContent);
        vscode.window.showInformationMessage(
          `Created deprecated copy: ${newFileName}`
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message !== "Operation cancelled by user"
        ) {
          vscode.window.showErrorMessage(
            `Error creating deprecated copy: ${error}`
          );
        }
      }
    }
  );

  // Command with label prompt
  let deprecateModuleAs = vscode.commands.registerCommand(
    "deprecate-module.deprecateModuleAs",
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          return;
        }

        const label = await vscode.window.showInputBox({
          prompt: "Enter deprecation label (optional)",
          placeHolder: "e.g. old, v1, legacy",
        });

        const filePath = uri.fsPath;
        const { newFilePath, newFileName } = await copyToDeprecatedFile(
          filePath,
          label
        );

        const content = fs.readFileSync(filePath, "utf8");
        const updatedContent = addDeprecatedToModuleName(
          content,
          "elixir",
          label
        );

        fs.writeFileSync(newFilePath, updatedContent);
        vscode.window.showInformationMessage(
          `Created deprecated copy: ${newFileName}`
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message !== "Operation cancelled by user"
        ) {
          vscode.window.showErrorMessage(
            `Error creating deprecated copy: ${error}`
          );
        }
      }
    }
  );

  context.subscriptions.push(deprecateModule, deprecateModuleAs);
}

// This method is called when your extension is deactivated
export function deactivate() {}
