# Reserenv

A slack bot that shows GLChat environment usage.

> [!WARNING]
> This bot doesn't correctly synchronize with infrastructure conditions. Therefore, the environment user might be inaccurate!

## Supported Environments

1. `dev`
2. `dev2`
3. `dev3`

> [!NOTE]
> Other env(s) support will be decided later.

## Commands

### `/reserve <environment>`

Reserve an environment under your name.

This action will fail under the following circumstances:

1. The environment is not supported
2. It's being reserved by other users or **you**

### `/unreserve <environment>`

Unreserve an environment that's currently being reserved by you.

This action will fail under the following circumstances:

1. The environment is not supported
2. It's being reserved by other users

### `/reservation [environment]`

See reservation for environments. If the `[environment]` parameter is omitted, this command will show reservation status for all available environments.

Unlikely to fail.

## License

This project is licensed under the [Unlicense](./LICENSE).
