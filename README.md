# tree-sitter-cobweb

Tree sitter parser and highlighter for `.cob` or `.cobweb` files used for [bevy_cobweb_ui](https://github.com/UkoeHB/bevy_cobweb_ui)


## Instructions

### Neovim

#### 1. Add filetype detection (for `.cob` and `.cobweb`)

In your `init.lua` or Neovim config:

```lua
vim.filetype.add({
  extension = {
    cob = "cobweb",
    cobweb = "cobweb",
  },
})
```

This tells Neovim to treat files with the `.cob` or `.cobweb` extensions as `cobweb` filetypes.

---

### 2. Install the Tree-sitter parser

```lua
-- In your `init.lua`
require'nvim-treesitter.parsers'.get_parser_configs().cobweb = {
  install_info = {
    url = "https://github.com/YOUR_USERNAME/tree-sitter-cobweb",
    files = { "src/parser.c", "src/scanner.c" }, -- if you use scanner.c
    branch = "main", -- or whatever branch has your parser
  },
  filetype = "cobweb",
}
```

Then run:

```vim
:TSInstall cobweb
```


