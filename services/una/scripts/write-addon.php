<?php
// Render ansible/templates/cnf/db_addon.sql to /tmp/addon.sql.
// unaio/una docker-entrypoint.sh appends that path onto install/sql/addon.sql
// and the installer executes it. This must happen before that entrypoint.
$sql = file_get_contents("/usr/local/share/una/db_addon.sql");
if ($sql === false) {
    fwrite(STDERR, "[railway-entrypoint] missing /usr/local/share/una/db_addon.sql\n");
    exit(1);
}

$replace = [
    "{{ proto }}://{{ host }}" => getenv("UNA_SOCKETS_URL") ?: "",
    "{{ soketi_secret }}" => getenv("SOKETI_SECRET") ?: "",
    "{{ neoUnaApiKey }}" => getenv("NEO_UNA_API_KEY") ?: "",
];
foreach ($replace as $token => $value) {
    $replace[$token] = str_replace("'", "''", $value);
}

$rendered = strtr($sql, $replace);
if (file_put_contents("/tmp/addon.sql", $rendered) === false) {
    fwrite(STDERR, "[railway-entrypoint] could not write /tmp/addon.sql\n");
    exit(1);
}
chmod("/tmp/addon.sql", 0644);
fwrite(STDERR, "[railway-entrypoint] wrote /tmp/addon.sql\n");
