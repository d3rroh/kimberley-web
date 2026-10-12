# Deployment

Every push to `master` runs `.github/workflows/docker-build.yml`:

1. **build**: builds the image and pushes `d3rroh/kimberley-web:latest` and `:<short-sha>` to Docker Hub.
2. **deploy**: copies the public site files (the same ones the image contains, plus `.htaccess`) over SSH into the web root that OpenLiteSpeed serves (`DEPLOY_PATH`). Files are overwritten in place; nothing else in the web root is deleted, so `.well-known/` and other server files are left alone.
3. Finally the workflow checks that https://kimberley.name.ng/ returns 200.

The server needs no Docker, only SSH and `tar`. Deploys can also be run by hand from the Actions tab (**Run workflow**).

## One-time setup

### On the server

The SSH user must be able to write to the web root, so the simplest choice is the site's own user (the owner of `public_html`):

```sh
ls -ld /home/kimberley.name.ng/public_html   # shows the owner
# paste the public key (deploy_key.pub) into that user's ~/.ssh/authorized_keys
```

### GitHub repository secrets

| Secret | Value |
|---|---|
| `SSH_HOST` | Server IP or hostname (the origin server, not the Cloudflare address) |
| `SSH_USER` | The owner of the web root |
| `SSH_PRIVATE_KEY` | The private key matching the server's `authorized_keys` entry |
| `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p <port> <host>`; check it against the server's real host key |
| `SSH_PORT` | Optional, defaults to `22` |

### GitHub repository variables

| Variable | Value |
|---|---|
| `DEPLOY_PATH` | Absolute path of the web root, e.g. `/home/kimberley.name.ng/public_html` |
