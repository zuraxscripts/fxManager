# fxManager

## Structure

Each app/package will have it's own more detailled structure in it's README.

```
fxManager/
├── apps/
│   ├── core/          # Process Manager & Webserver
│   ├── resource/      # FxServer resource to connect to panel
│   └── webpanel/      # React SPA served by the webserver
├── packages/
│   ├── database/      # Drizzle schema & Migration handler
│   ├── shared/        # Enums, types, and utils
│   └── ui/            # Shared React ShadCN components
├── biome.json         # Root linting/formatting
├── package.json       # Workspace definitions
└── turbo.json         # Build pipeline config
```

## Development

## Errrh anything else ?

![dumb monke](.github/image.png)
