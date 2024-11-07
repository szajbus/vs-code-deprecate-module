# deprecate-module

Adds *Deprecate module* command to right-click menu in Explorer.

When clicked, makes a copy of the file by adding `_deprecated` to its basename.

For example:

* copies `foo.ex` to `foo_deprecated.ex`
* copies `foo_test.exs` to `foo_deprecated_test.ex`

Additionally appends `Deprecated` suffix to module name in the new file.

Current support:

* Elixir
