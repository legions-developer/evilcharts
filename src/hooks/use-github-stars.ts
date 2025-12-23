export const useGithubStars = async (): Promise<number | null> => {
  try {
    const res = await fetch(`https://api.github.com/repos/legions-developer/evilcharts`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.stargazers_count;
  } catch (error) {
    console.error(error);
    return null;
  }
};
