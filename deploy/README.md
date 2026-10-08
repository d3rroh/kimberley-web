# Deployment

Every push to `master` runs `.github/workflows/docker-build.yml`:

1. **build**: builds the image and pushes `d3rroh/kimberley-web:latest` and `:<short-sha>` to Docker Hub.
2. **deploy**: connects to the server over SSH and runs `deploy/deploy.sh` with the exact `:<short-sha>` image. The script:
   - pulls the image and stops whatever container is running any `d3rroh/kimberley-web` tag (even one started by hand),
   - starts the new container hardened (read-only filesystem, all capabilities dropped except the four nginx needs, `no-new-privileges`, memory/pid limits, `--restart unless-stopped`),
   - health-checks it and **rolls back to the previous container** if it fails to start or respond.
3. Finally the workflow checks that https://kimberley.name.ng/ returns 200.

Deploys can also be run by hand from the Actions tab (**Run workflow**).

## One-time setup

### On the server

```sh
# A dedicated deploy user that can run docker (docker group = root-equivalent;
# keep this key only in GitHub secrets)
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo -u deploy mkdir -p -m 700 /home/deploy/.ssh
# paste the public key (deploy_key.pub) into:
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
```

### GitHub repository secrets

| Secret | Value |
|---|---|
| `SSH_HOST` | Server IP or hostname (the origin server, not the Cloudflare address) |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | The private key matching the server's `authorized_keys` entry |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p <port> <host>`; check it against the server's real host key |
| `SSH_PORT` | Optional, defaults to `22` |

Optional repository **variables**: `CONTAINER_NAME` (default `kimberley-web`), `HOST_PORT` (default `80`).
