import socket
import json
import os
from pathlib import Path

def find_available_port(start_port=8000, end_port=9000):
    """Find an available port in the given range."""
    for port in range(start_port, end_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                # Try to bind to the port
                sock.bind(('', port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"No available ports in range {start_port}-{end_port}")

def save_port_to_file(port):
    """Save the port number to a JSON file."""
    config_dir = Path(__file__).parent.parent.parent / '.config'
    config_dir.mkdir(exist_ok=True)
    
    port_file = config_dir / 'server_port.json'
    with open(port_file, 'w') as f:
        json.dump({'port': port}, f)
    return port_file

def get_server_port():
    """Get an available port and save it to a file."""
    port = find_available_port()
    port_file = save_port_to_file(port)
    print(f"Server port {port} saved to {port_file}")
    return port
