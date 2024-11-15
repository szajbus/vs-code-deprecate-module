# deprecate-module

Adds *Deprecate module* and *Deprecate module as...* commands to right-click menu in Explorer.

When clicked, makes a copy of the file by adding `_deprecated` or `_deprecated_<label>` to its basename.

For example:

* copies `foo.ex` to `foo_deprecated.ex` (or `foo_deprecated_some_label.ex`)
* copies `foo_test.exs` to `foo_deprecated_test.ex` (or `foo_deprecated_some_label_test.exs`)

Additionally appends `Deprecated` or `Deprecated<Label>` suffix to module name in the new file.

Current support:

* Elixir
