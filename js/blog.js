const md = window.markdownit();

async function fetchAndListPosts() {
  const response = await fetch(
    "https://api.github.com/repos/alemanoelsilva/alemanoelsilva.github.io/contents/_posts"
  );
  const posts = await response.json();

  const postList = document.querySelector(".post-list");

  for (const post of posts) {
    const postContent = await fetch(post.download_url).then((res) =>
      res.text()
    );
    const [, frontMatter, content] = postContent.split("---");
    const metadata = parseFrontMatter(frontMatter);

    const listItem = document.createElement("li");
    const postDate = new Date(metadata.date).toLocaleDateString();
    const postFileName = post.name.replace(".md", ".html");

    listItem.innerHTML = `
            <h2><a href="post.html?post=${postFileName}">${
      metadata.title
    }</a></h2>
            <p><em>Published on ${postDate}</em></p>
            <p>${getExcerpt(content)}</p>
        `;
    postList.appendChild(listItem);
  }
}

function parseFrontMatter(frontMatter) {
  const lines = frontMatter.trim().split("\n");
  const metadata = {};
  for (const line of lines) {
    const [key, value] = line.split(":").map((s) => s.trim());
    metadata[key] = value;
  }
  return metadata;
}

function getExcerpt(content, maxLength = 150) {
  const rendered = md.render(content);
  const stripped = rendered.replace(/<[^>]*>/g, "");
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + "..."
    : stripped;
}

fetchAndListPosts();
