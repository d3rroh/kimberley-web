# Deployment

Every push to `master` runs `.github/workflows/docker-build.yml`:

1. **build**: builds the image and pushes `d3rroh/kimberley-web:latest` and `:<short-sha>` to Docker Hub.
2. **deploy**: points the k3s deployment at the exact `:<short-sha>` image (`kubectl set image`) and waits for the rollout to finish, then checks that https://kimberley.name.ng/ returns 200.

The deploy step is skipped (with a notice) until `KUBECONFIG_B64` is set, so pushes still build and push the image. Deploys can also be run by hand from the Actions tab (**Run workflow**).

## One-time setup

### GitHub repository secret

| Secret | Value |
|---|---|
| `KUBECONFIG_B64` | `base64 -w0` of a kubeconfig for the k3s cluster, with its `server:` set to an address GitHub can reach |

```sh
base64 -w0 <path-to-kubeconfig> | gh secret set KUBECONFIG_B64 -R d3rroh/kimberley-web
```

### GitHub repository variables (optional)

| Variable | Default |
|---|---|
| `K8S_NAMESPACE` | `kimberley-web` |
| `K8S_DEPLOYMENT` | `kimberley-web` |
| `K8S_CONTAINER` | `web` |

Check the real names with `kubectl get deploy -A -o wide`.
