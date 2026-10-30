# UNA/NEO Railway template

This catalog is the UNA/NEO service list the worker filters and scales. The worker deploys the published template with `templateDeployV2`, which is what attributes usage to the [Open Source Partner Program](https://railway.com/partners).

`db`, `soketi`, and `mail` are registry images. `una`, `neo`, `phpmyadmin`, and `jot` are built from the public repo [unacms/una-hosting-railway-template](https://github.com/unacms/una-hosting-railway-template). That repo's root is this [railway/](.) directory, so each service root is `/services/<name>` ([services/](services/) with a `Dockerfile` and `scripts/railway-entrypoint.sh`; jot also has `scripts/configure-config.js`). The Dockerfile `FROM` line is the upstream image. The entrypoint is the boot logic that used to be a start command. Railway builds that directory; there is no start command in [.railway/railway.ts](../.railway/railway.ts).

Service names in the published template must match the keys in [una-neo.template.json](una-neo.template.json): `db`, `una`, `neo`, `soketi`, `phpmyadmin`, `jot`, `mail`. `una` keeps `db`. AWS and DigitalOcean keep a separate `una-api` container so UNA can run under `/una` on one domain. This template has a single `una` service because Railway assigns each service its own domain. Variable names that should receive job values must use the same names as the job fields (`unaSiteEmail`, `unaAdminEmail`, `unaDbPwd`, `unaMysqlRootPassword`, `neoUnaApiKey`, `neoUnaUrl`, `logo`, `splash_text_component`, `join_text_component`, `global_css_component`, `soketi_secret`). `logo`, `splash_text_component`, `join_text_component`, and `global_css_component` are on `neo`. The neo entrypoint writes them into the customization files compose bind-mounts. Leave Railway references such as `${{db.MYSQL_URL}}` as references; the worker will not overwrite them.

`image` in the catalog is the registry image for `db`, `soketi`, and `mail`, and the `FROM` image for services that set `root`. `phpmyadmin:5.2.3` is the same image as `phpmyadmin:5.2.3-apache`. `code` is the published template code. The deploy URL is `https://railway.com/deploy/una-template`.

The canonical project is `una-template` in the Yasko Studio workspace. [.railway/railway.ts](../.railway/railway.ts) is the source of truth for images, build directories, variables, volumes, replicas, and image auto-update. Do not put project ids or generated `*.up.railway.app` hostnames in that file.

`npm run check:railway` fails when the catalog's service names, images, roots, variable names, `default`, `public`, or `us-west` scale drift from the IaC file or from a service Dockerfile.

## Image auto-update

`db` and `mail` set `autoUpdates.type` to `minor` with an Anytime window (every UTC day, hour 0 through 24). Railway still caches registry checks for up to a few hours. `soketi` is a quay.io image, which Railway does not auto-update.

`mariadb:13.0.2` is a semantic version, so it moves to newer minors and patches. A MariaDB minor (`13.0.2` to a later `13.1`) can be incompatible. Skip that version on the service if a release misbehaves. `namshi/smtp` is not a semantic version, so the policy uses `tagMode: "sha"` and follows a new digest of the same tag.

`una`, `neo`, `phpmyadmin`, and `jot` are GitHub builds from the public template repo. Change the `ARG` default in that service's Dockerfile (`UNA_IMAGE_TAG`, `NEO_IMAGE_TAG`, `PMA_IMAGE_TAG`, `JOT_IMAGE_TAG`) and push `main` there. Railway rebuilds a service when a commit touches its watch path (`/services/<name>/**`).

`railway templates create` copies `source.image` and drops `source.autoUpdates`. The canonical project still has the policy. The worker stamps the same policy onto each image service before `templateDeployV2`, so projects deployed by this worker update themselves. A marketplace deploy uses Railway's stored snapshot, which does not include the policy. When a copy does update, Railway notifies that project's workspace admins. Railway does not email everyone who deployed an image template when the author changes the template. That mail exists only for GitHub-backed services.

## Publish and maintain

Apply at [railway.com/partners](https://railway.com/partners) if this template should earn [template kickback](https://railway.com/open-source-kickback). Marketplace approval is Railway's. Publishing does not grant it.

Link the canonical project, then plan and apply:

```bash
railway link --project e58cdc3a-7023-4a2e-9de2-ae75cf009f95 --environment production --workspace "Yasko Studio"
railway config plan
railway config apply
```

Edit registry images, variables, replicas, volumes, and `autoUpdates` only in [.railway/railway.ts](../.railway/railway.ts). Edit boot behavior in the public template repo under `services/<name>` (the copy in this repo is `railway/services/<name>`). Image bumps on `db` and `mail` copies that already deployed do not need a republish. The policy on those services does the update. A change of service source reaches deployed copies only after apply on the canonical project and a new published template.

`railway templates create` makes a new draft, and there is no API to overwrite an existing template's service config. Run it only when `code` in [una-neo.template.json](una-neo.template.json) is empty, or when a service, variable, volume, or service source is added or removed and must ship as a new template. Publish that draft and replace `code` only after the worker should select the new template. Unpublish the previous template after that. Push `main` on [unacms/una-hosting-railway-template](https://github.com/unacms/una-hosting-railway-template) before apply, because Railway clones that branch to build `una`, `neo`, `phpmyadmin`, and `jot`.

```bash
railway templates create --project e58cdc3a-7023-4a2e-9de2-ae75cf009f95 --environment production --json
railway templates publish <id> --category CMS --description "UNA/NEO community site and API" --readme-file railway/TEMPLATE.md --demo-project e58cdc3a-7023-4a2e-9de2-ae75cf009f95 --json
```

The marketplace description must be at least 25 characters. The public readme is [TEMPLATE.md](TEMPLATE.md), not this file. Public domains for `una` (port 80), `neo` (port 3000), and `phpmyadmin` (port 80) are created with `railway domain` after apply. Generated domains are not written into the IaC file. Add them before `templates create` so the snapshot asks deployers for a public domain.

Marketplace Deploy includes every service. The worker still deploys only `"default": true` (`db`, `una`, `neo`) unless `containers` says otherwise.

Deploy through the worker with `provider: "railway"`. The worker calls `templateDeployV2` on the published code.

## Which template the worker uses

`U_RAILWAY_TEMPLATE` is either a path to this catalog or a published template code (`https://railway.com/deploy/<code>`). The default is `railway/una-neo.template.json`. A job can override it with `options.template` using the same kind of value.

A path is read for its `code` and for which services are default. A bare name is the published code. The catalog's default flags still decide which services are included when `containers` is omitted.

```bash
U_RAILWAY_TOKEN="workspace-or-account-token"
U_RAILWAY_WORKSPACE_ID="workspace-id"
U_RAILWAY_TEMPLATE="railway/una-neo.template.json"
```

Job config overrides the token and workspace the same way as the other providers:

```js
options: {
  template: "railway/una-neo.template.json",
  templateVariables: { CUSTOM_FLAG: "on" },
  config: {
    "railway:token": process.env.U_RAILWAY_TOKEN,
    "railway:workspaceId": process.env.U_RAILWAY_WORKSPACE_ID,
  },
}
```

## Deploy, edit, scale

Omit `containers` to deploy every service marked `"default": true` (`db`, `una`, `neo`). Pass `containers` to keep a subset. `una` always keeps `db`.

`scale` sets replica counts. Region names are `us-east`, `us-west`, `eu-west`, and `southeast-asia`, or a Railway region id. See [railway scale](https://docs.railway.com/cli/scale).

```js
{
  provider: "railway",
  containers: ["una", "neo"],
  scale: { neo: { "us-west": 2 } },
}
```

Edit uses the same provider. `containers` is the desired set: services in that list that are not in the project are added from the template, and services no longer in the list are deleted. The worker will not delete `db` while `una` remains. `scale` is optional. Omitted services keep their current replica count. Pass `scale` alone to change replicas without adding or removing services.

```js
{
  provider: "railway",
  containers: ["una", "neo", "phpmyadmin"],
  scale: { neo: { "us-west": 2 }, una: { "us-east": 1 } },
}
```

Generated `*.up.railway.app` domains are already HTTPS. `enable-ssl` sets `domain` as the custom domain on the public service (`una`, then `neo`). Railway issues the certificate after DNS verifies. Run it again with a different domain to replace the previous custom domain; the generated Railway domain stays. The job result includes `dnsRecords` and `verificationToken`. Add both records at the DNS provider.
