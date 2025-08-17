import fetch from 'node-fetch';

export interface CdnProvider {
  urlFor(path: string): string;
  purge(paths: string[]): Promise<void>;
}

export class CloudflareCdnProvider implements CdnProvider {
  constructor(private opts: { zoneId: string; apiToken: string; baseUrl: string }) {}

  urlFor(path: string) {
    return `${this.opts.baseUrl}${path}`;
  }

  async purge(paths: string[]) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${this.opts.zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.opts.apiToken}`
      },
      body: JSON.stringify({ files: paths.map((p) => this.urlFor(p)) })
    });
  }
}
