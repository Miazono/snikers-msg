---------- Server-wide settings ----------

plugin_paths = {}

modules_enabled = {
    -- Core
    "roster";
    "saslauth";
    "tls";
    "dialback";
    "disco";
    "carbons";
    "mam";
    "csi_simple";
    "ping";
    
    -- OMEMO
    "pubsub";
    "pep";
    
    -- Web
    "websocket";
    "http";
    
    -- Admin
    "admin_adhoc";
    "blocklist";
    "bookmarks";
}

modules_disabled = {
    "s2s";  -- Отключить федерацию для изоляции
}

allow_registration = false
c2s_require_encryption = true
s2s_require_encryption = true
consider_websocket_secure = true

limits = {
    c2s = {
        rate = "10kb/s";
        burst = "2s";
    };
}
c2s_stanza_size_limit = 256 * 1024

log = {
    warn = "*syslog";
    error = "*syslog";
}

storage = "sql"
sql = {
    driver = "PostgreSQL";
    database = "prosody";
    username = "prosodyuser";
    password = os.getenv("POSTGRES_PASSWORD");
    host = "postgres";
}

archive_expires_after = "1week"

http_ports = { 5280 }
http_interfaces = { "0.0.0.0", "::" }
https_ports = {}
https_interfaces = {}

---------- VirtualHost ----------
VirtualHost (os.getenv("DOMAIN") or "localhost")
    enabled = true
    
    ssl = {
        certificate = "/etc/letsencrypt/live/" .. (os.getenv("DOMAIN") or "localhost") .. "/fullchain.pem";
        key = "/etc/letsencrypt/live/" .. (os.getenv("DOMAIN") or "localhost") .. "/privkey.pem";
    }