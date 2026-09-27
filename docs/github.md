# GitHub integration

Vibe Surgeon can emit SARIF 2.1.0 so repository findings can appear in GitHub code scanning.

```bash
npx -y vibe-surgeon@latest sarif . --output vibe-surgeon.sarif
```

Copy [`templates/github/vibe-surgeon.yml`](../templates/github/vibe-surgeon.yml) into `.github/workflows/vibe-surgeon.yml` in a target repository.

The workflow:

1. checks repository health;
2. runs change guard on pull requests;
3. generates SARIF;
4. uploads findings through GitHub CodeQL's SARIF uploader.

For private repositories, GitHub code-scanning availability depends on the repository's GitHub plan and security configuration.
