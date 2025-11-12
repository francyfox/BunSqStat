import type { IFormatItem } from "./types";

export const SQUID_LOG_FORMAT_VARIANT = {
	squid: "%ts.%03tu %6tr %>a %Ss/%03>Hs %<st %rm %ru %[un %Sh/%<a %mt",
	common: '%>a - %[un [%tl] "%rm %ru HTTP/%rv" %>Hs %<st %Ss:%Sh',
	combined:
		'%>a - %[un [%tl] "%rm %ru HTTP/%rv" %>Hs %<st "%{Referer}>h" "%{User-Agent}>h" %Ss:%Sh',
	referrer: "%ts.%03tu %>a %{Referer}>h %ru",
	useragent: '%>a [%tl] "%{User-Agent}>h"',
};
export const SQUID_FORMAT_MAP: IFormatItem[] = [
	// ===== TIME =====
	{
		token: "%ts.%tu",
		field: "timestamp",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
		transform: "timestampToMs",
	},
	{
		token: "%ts",
		field: "timestamp",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
		transform: "timestampToMs",
	},
	{
		token: "%03tu",
		field: "milliseconds",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
	},
	{
		token: "%tu",
		field: "milliseconds",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
	},
	{
		token: "%tl",
		field: "localTime",
		redisType: "TEXT",
		postgresType: "TIMESTAMP",
	},
	{
		token: "%tg",
		field: "gmtTime",
		redisType: "TEXT",
		postgresType: "TIMESTAMP",
	},
	{
		token: "%tr",
		field: "duration",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%dt",
		field: "dnsTime",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%tS",
		field: "transactionStartTime",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
		transform: "timestampToMs",
	},
	{
		token: "%busy_time",
		field: "busyTimeNs",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},

	// ===== CONNECTION (CLIENT) =====
	{
		token: "%>a",
		field: "clientIP",
		redisType: "TAG",
		postgresType: "INET",
		transform: "dotToUnderscore",
	},
	{
		token: "%>A",
		field: "clientFQDN",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%>p",
		field: "clientPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%>eui",
		field: "clientEUI",
		redisType: "TEXT",
		postgresType: "VARCHAR(32)",
	},
	{
		token: "%>la",
		field: "localIP",
		redisType: "TAG",
		postgresType: "INET",
		transform: "dotToUnderscore",
	},
	{
		token: "%>lp",
		field: "localPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%>qos",
		field: "clientQOS",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%>nfmark",
		field: "clientNFMark",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%transport::>connection_id",
		field: "connectionId",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
	{
		token: "%la",
		field: "listeningIP",
		redisType: "TAG",
		postgresType: "INET",
		transform: "dotToUnderscore",
	},
	{
		token: "%lp",
		field: "listeningPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%>handshake",
		field: "clientHandshake",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "base64Decode",
	},

	// ===== CONNECTION (SERVER / PEER) =====
	{
		token: "%<a",
		field: "serverIP",
		redisType: "TAG",
		postgresType: "INET",
		transform: "dotToUnderscore",
	},
	{
		token: "%<A",
		field: "serverFQDN",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%<p",
		field: "serverPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%<la",
		field: "serverLocalIP",
		redisType: "TAG",
		postgresType: "INET",
		transform: "dotToUnderscore",
	},
	{
		token: "%<lp",
		field: "serverLocalPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%<qos",
		field: "serverQOS",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%<nfmark",
		field: "serverNFMark",
		redisType: "TEXT",
		postgresType: "TEXT",
	},

	// ===== ACCESS CONTROL / USER =====
	{
		token: "%et",
		field: "externalAclTag",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ea",
		field: "externalAclLog",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%un",
		field: "user",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%ul",
		field: "authUser",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%ue",
		field: "externalAclUser",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%credentials",
		field: "credentials",
		redisType: "TEXT",
		postgresType: "TEXT",
	},

	// ===== HTTP REQUEST =====
	{
		token: "%http::rm",
		field: "method",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%rm",
		field: "method",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%http::>rm",
		field: "clientMethod",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%http::<rm",
		field: "serverMethod",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},

	{
		token: "%http::ru",
		field: "url",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "normalizeURL",
	},
	{
		token: "%ru",
		field: "url",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "normalizeURL",
	},
	{
		token: "%http::>ru",
		field: "clientURL",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "normalizeURL",
	},
	{
		token: "%http::<ru",
		field: "serverURL",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "normalizeURL",
	},

	{
		token: "%http::>rs",
		field: "clientScheme",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%http::<rs",
		field: "serverScheme",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},

	{
		token: "%http::>rd",
		field: "clientDomain",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%http::<rd",
		field: "serverDomain",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},

	{
		token: "%http::>rP",
		field: "clientURLPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%http::<rP",
		field: "serverURLPort",
		redisType: "NUMERIC",
		postgresType: "INTEGER",
	},
	{
		token: "%http::rp",
		field: "urlPath",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{ token: "%rp", field: "urlPath", redisType: "TEXT", postgresType: "TEXT" },
	{
		token: "%http::>rp",
		field: "clientURLPath",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%http::<rp",
		field: "serverURLPath",
		redisType: "TEXT",
		postgresType: "TEXT",
	},

	{
		token: "%http::rv",
		field: "httpVersion",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%rv",
		field: "httpVersion",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%http::>rv",
		field: "clientHTTPVersion",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},
	{
		token: "%http::<rv",
		field: "serverHTTPVersion",
		redisType: "TAG",
		postgresType: "VARCHAR(16)",
	},

	// ===== HTTP RESPONSE =====
	{
		token: "%http::<Hs",
		field: "serverStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},
	{
		token: "%http::>Hs",
		field: "clientStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},
	{
		token: "%>Hs",
		field: "resultStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},
	{
		token: "%03>Hs",
		field: "resultStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},
	{
		token: "%<Hs",
		field: "resultStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},
	{
		token: "%03<Hs",
		field: "resultStatus",
		redisType: "NUMERIC",
		postgresType: "SMALLINT",
		transform: "normalizeStatus",
	},

	{
		token: "%http::mt",
		field: "contentType",
		redisType: "TEXT",
		postgresType: "VARCHAR(100)",
	},
	{
		token: "%mt",
		field: "contentType",
		redisType: "TEXT",
		postgresType: "VARCHAR(100)",
	},

	// ===== SQUID RESULT/HIERARCHY =====
	{
		token: "%Ss",
		field: "resultType",
		redisType: "TAG",
		postgresType: "VARCHAR(32)",
	},
	{
		token: "%Sh",
		field: "hierarchyType",
		redisType: "TAG",
		postgresType: "VARCHAR(32)",
	},

	// ===== SIZE =====
	{
		token: "%<st",
		field: "bytes",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
	{
		token: "%>st",
		field: "requestSize",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
	{
		token: "%<bs",
		field: "bodyBytesReceived",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
	{
		token: "%>bs",
		field: "bodyBytesSent",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},

	// ===== HEADERS (examples — используйте динамику для произвольных) =====
	{
		token: "%{User-Agent}>h",
		field: "userAgent",
		redisType: "TEXT",
		postgresType: "TEXT",
		transform: "normalizeUserAgent",
	},
	{
		token: "%{Referer}>h",
		field: "referer",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%{Host}>h",
		field: "host",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%{Content-Type}<h",
		field: "responseContentType",
		redisType: "TEXT",
		postgresType: "VARCHAR(100)",
	},

	// ===== SSL/TLS =====
	{
		token: "%ssl::>sni",
		field: "sslSNI",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},
	{
		token: "%ssl::>cert_subject",
		field: "sslCertSubject",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ssl::>cert_issuer",
		field: "sslCertIssuer",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ssl::>cert_errors",
		field: "sslCertErrors",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ssl::<cert_subject",
		field: "sslServerCertSubject",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ssl::<cert_issuer",
		field: "sslServerCertIssuer",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%ssl::bump_mode",
		field: "sslBumpMode",
		redisType: "TAG",
		postgresType: "VARCHAR(32)",
	},
	{
		token: "%us",
		field: "sslClientName",
		redisType: "TEXT",
		postgresType: "VARCHAR(255)",
	},

	// ===== ERROR / META =====
	{
		token: "%sn",
		field: "sequenceNumber",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
	{
		token: "%err_code",
		field: "errorCode",
		redisType: "TEXT",
		postgresType: "VARCHAR(64)",
	},
	{
		token: "%err_detail",
		field: "errorDetail",
		redisType: "TEXT",
		postgresType: "TEXT",
	},
	{
		token: "%master_xaction",
		field: "masterTransaction",
		redisType: "NUMERIC",
		postgresType: "BIGINT",
	},
];
