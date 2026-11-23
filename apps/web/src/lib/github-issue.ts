/**
 * PaperForge — Shared GitHub Issue & Repository Dispatch Helpers
 * Used by the answer-mismatch flow and the error-report flow.
 */

export interface GitHubIssueResult {
  issueCreated: boolean;
  issueNumber?: number;
  issueUrl?: string;
  reason?: string;
}

export interface GitHubAgentResult {
  dispatched: boolean;
  reason?: string;
}

function githubRepo(): string {
  return process.env.GITHUB_REPO || 'Arjundevjha/PaperForge';
}

function githubToken(): string | undefined {
  return process.env.GITHUB_DISPATCH_TOKEN || process.env.GITHUB_TOKEN;
}

/**
 * Creates a GitHub issue via the REST API. Returns structured results so
 * callers can surface issue URLs to users and failures to toast messages.
 */
export async function createGitHubIssue(payload: {
  labels: string[];
  title: string;
  body: string;
}): Promise<GitHubIssueResult> {
  const token = githubToken();
  if (!token) {
    return { issueCreated: false, reason: 'GITHUB_DISPATCH_TOKEN not configured' };
  }

  const repo = githubRepo();
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        labels: payload.labels,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        issueCreated: false,
        reason: `GitHub issue HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }

    const data = await res.json();
    return {
      issueCreated: true,
      issueNumber: data.number,
      issueUrl: data.html_url,
    };
  } catch (err: any) {
    return { issueCreated: false, reason: err?.message || 'GitHub issue creation failed' };
  }
}

/**
 * Triggers a `repository_dispatch` event so GitHub Actions can run the
 * PaperForge cloud support/auto-fix agent.
 */
export async function triggerGitHubAgent(payload: {
  eventType: string;
  clientPayload: Record<string, unknown>;
}): Promise<GitHubAgentResult> {
  const token = githubToken();
  if (!token) {
    return { dispatched: false, reason: 'GITHUB_DISPATCH_TOKEN not configured' };
  }

  const repo = githubRepo();
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: payload.eventType,
        client_payload: payload.clientPayload,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        dispatched: false,
        reason: `GitHub dispatch HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }

    return { dispatched: true };
  } catch (err: any) {
    return { dispatched: false, reason: err?.message || 'GitHub dispatch failed' };
  }
}
