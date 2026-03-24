# @streamyy/cli

CLI package for scaffolding Streamyy starters.

## Usage

```bash
npx @streamyy/cli init
npx @streamyy/cli init --backend
npx @streamyy/cli init --frontend
npx @streamyy/cli init --frontend --custom
```

## Output

- `streamyy-backend` for the backend starter
- `streamyy-frontend` for the frontend starter

Use `--custom` when you want the frontend starter to scaffold `StreamyyProvider` and `useStreamyy()` instead of the default widget.
