const md = window.markdownit();

async function fetchAndRenderPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const postFileName = urlParams.get("post");

  if (!postFileName) {
    document.getElementById("post-content").innerHTML =
      "<p>Post not found.</p>";
    return;
  }

  const postPath = `_posts/${postFileName.replace(".html", ".md")}`;
  const response = await fetch(
    `https://raw.githubusercontent.com/alemanoelsilva/alemanoelsilva.github.io/master/${postPath}`
  );
  const postContent = await response.text();

  const [, frontMatter, content] = postContent.split("---");
  const metadata = parseFrontMatter(frontMatter);

  const postElement = document.getElementById("post-content");
  const postDate = new Date(metadata.date).toLocaleDateString();

  postElement.innerHTML = `
        <h1>${metadata.title}</h1>
        <p><em>Published on ${postDate}</em></p>
        ${md.render(content)}
    `;

  document.title = metadata.title;
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

fetchAndRenderPost();
