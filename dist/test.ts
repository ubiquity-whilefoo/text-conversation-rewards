import { Octokit } from "@octokit/rest";
import { readFileSync, readdirSync } from "fs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "ubiquity-whilefoo";
const repo = "text-conversation-rewards";
const ref = "heads/development";

const currentCommit = await octokit.rest.git.getRef({
    owner,
    repo,
    ref
  });

// all files in dist/ folder
const files = readdirSync('dist/');
const blobs = await Promise.all(files.map(async (file) => {
    const blob = await octokit.rest.git.createBlob({
        owner: owner,
        repo: repo,
        content: readFileSync(`dist/${file}`).toString('base64'),
        encoding: 'base64'
    });
    return {
        path: `dist/${file}`,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha,
    }
}));
console.log(blobs);

const tree = await octokit.rest.git.createTree({
    owner: owner,
    repo: repo,
    tree: blobs,
    base_tree: currentCommit.data.object.sha,
});
console.log(tree);

const newCommit = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: 'test commit',
    tree: tree.data.sha,
    parents: [currentCommit.data.object.sha]
  });
  console.log(newCommit);

await octokit.rest.git.updateRef({
    owner,
    repo,
    ref,
    sha: newCommit.data.sha,
    force: false
});