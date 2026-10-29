# Deploy and Host UNA/NEO on Railway

UNA is a community site, and NEO is its front end. This template runs both with MariaDB, plus optional phpMyAdmin, jot, and mail.

## About Hosting UNA/NEO

The default services are `db`, `una`, and `neo`. The marketplace deploy includes every service. Remove a service you do not want before you deploy.

`una` reaches MariaDB on the private network and keeps its files on a `/var/www` volume. Each service has its own domain, so UNA is not mounted under a `/una` path.

You will be asked for `unaSiteEmail`, `unaAdminEmail`, `unaDbPwd`, `unaMysqlRootPassword`, `neoUnaApiKey`, `neoUnaUrl`, `logo`, `splash_text_component`, `join_text_component`, `global_css_component`, and `soketi_secret`. `logo`, `splash_text_component`, `join_text_component`, and `global_css_component` belong to `neo`.

## Why Deploy UNA/NEO on Railway

Railway gives each service a private network, a volume, and HTTPS on the public services. MariaDB tags that are semantic versions (`1.2.3` or `v1.2.3`) move to newer minor and patch releases after Railway detects them. Detection can take a few hours. Workspace admins are notified when a service updates. The mail relay follows a new digest of `namshi/smtp`.

UNA, NEO, phpMyAdmin, and jot are custom images built for this template. Their base image tags are pinned in the image build. A MariaDB minor bump (`13.0.2` to a later `13.1`) can be incompatible. Skip that version on the service if a release misbehaves.

## Common Use Cases

- Host a UNA community site with the NEO front end
- Add phpMyAdmin when you need to inspect MariaDB
- Add jot or the mail relay only for the stacks that use them

## Dependencies for UNA/NEO Hosting

- MariaDB 13 for the UNA database
- Custom images built on the published `unaio/una` and `unaio/neo` images
- A volume for database files and for each UNA web root

### Deployment Dependencies

- [UNA](https://una.io/)
- [MariaDB](https://mariadb.org/)
- [phpMyAdmin](https://www.phpmyadmin.net/)
