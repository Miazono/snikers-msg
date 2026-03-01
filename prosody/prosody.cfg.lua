---------- Server-wide settings ----------

plugin_paths = {}
pidfile = "/var/run/prosody/prosody.pid"

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
    "bosh";
    "http_file_share";  

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
cross_domain_websocket = true
cross_domain_bosh = true 

-- Files
http_file_share_size_limit = 10485760    -- 10 MB на файл
http_file_share_daily_quota = 104857600  -- 100 MB в сутки на пользователя
http_file_share_expire_after = 60 * 60 * 24 * 7  -- хранить 7 дней
http_external_url = "https://chat.pavloman.ru"

limits = {
    c2s = {
        rate = "10kb/s";
        burst = "2s";
    };
}
c2s_stanza_size_limit = 256 * 1024

log = {
    info  = "*console";
    debug = "*console";
    warn  = "*console";
    error = "*console";
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
