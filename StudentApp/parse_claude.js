import fs from 'fs';

async function main() {
  const artifactId = 'aa6dbb55-f07a-4053-9856-f35d6a52da38';
  const endpoints = [
    `https://claude.ai/api/public/published_artifacts/${artifactId}`,
    `https://claude.ai/api/public/artifacts/aa6dbb55-f07a-4053-9856-f35d6a52da38`,
    `https://claude.ai/api/v1/public_artifacts/${artifactId}`,
    `https://claude.ai/api/artifacts_public/${artifactId}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'accept': 'application/json',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log(`${ep} -> ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log('SUCCESS! Keys:', Object.keys(json));
        fs.writeFileSync('D:/StudentApp/artifact_data.json', JSON.stringify(json, null, 2));
      }
    } catch(e) {
      console.log(ep, e.message);
    }
  }
}

main();
