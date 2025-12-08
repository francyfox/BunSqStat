set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
SSL_DIR="${SSL_DIR:-${SCRIPT_DIR}/docker/ssl}"
CA_KEY="${CA_KEY:-$SSL_DIR/squid.key}"
CA_CRT="${CA_CRT:-$SSL_DIR/squid.crt}"

CA_SUBJECT="${CA_SUBJECT:-/CN=proxy.tp.oil/O=Squid/C=KZ}"
KEY_SIZE="${KEY_SIZE:-4096}" # 4096/2048
CERT_DAYS="${CERT_DAYS:-3650}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

generate_ssl_cert() {
    print_info "Checking SSL certificate setup..."

    if [ ! -d "$SSL_DIR" ]; then
      mkdir -p "$SSL_DIR"
      print_info "Created: $SSL_DIR"
    fi

    # Set permissions for SSL certificate directory
    if [ -d "$SSL_DIR" ]; then
        chmod 755 "$SSL_DIR"
        chmod 644 "$SSL_DIR"/* 2>/dev/null || true
        print_success "SSL certificate directory permissions set"
    fi

    # Check if OpenSSL is available
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi

    if [ ! -f "$CA_KEY" ] || [ ! -f "$CA_CRT" ]; then
        print_info "Generating new SSL certificate..."
        print_info "  Key size: $KEY_SIZE bits"
        print_info "  Validity: $CERT_DAYS days"
        print_info "  Subject: $CA_SUBJECT"

        # Generate private key
        openssl genrsa -out "$CA_KEY" "$KEY_SIZE"

        # Generate self-signed certificate
        openssl req -new -x509 -days "$CERT_DAYS" \
            -extensions v3_ca \
            -key "$CA_KEY" \
            -out "$CA_CRT" \
            -subj "$CA_SUBJECT"

        # Set correct permissions
        chmod 644 "$CA_KEY"
        chmod 644 "$CA_CRT"

        print_success "SSL certificate generated:"
        print_info "    Private key: $CA_KEY"
        print_info "    Certificate: $CA_CRT"

        # Show certificate info
        echo ""
        print_info "Certificate details:"
        openssl x509 -in "$CA_CRT" -text -noout | grep -E "(Subject|Issuer|Not Before|Not After)" | sed 's/^/  /'

        echo ""
        print_warning "IMPORTANT: Install $CA_CRT as trusted CA in browsers to avoid SSL warnings"

    else
        print_success "SSL certificate already exists:"
        print_info "  Private key: $CA_KEY"
        print_info "  Certificate: $CA_CRT"

        # Check expiration
        if openssl x509 -checkend 86400 -noout -in "$CA_CRT" >/dev/null; then
            print_success "Certificate is valid"
        else
            print_warning "Certificate is expiring soon or expired!"
        fi
    fi

    # Show certificate fingerprint
    echo ""
    print_info "Certificate fingerprint (SHA256):"
    openssl x509 -noout -fingerprint -sha256 -in "$CA_CRT" | sed 's/.*=/  /'
}

main() {
  echo "Creating ssl certs..."
  generate_ssl_cert
  print_success "Certs created successfully!"
}

main "$@"