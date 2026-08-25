// topicResources.js
// Maps each topic to a recommended YouTube video/playlist for students to study
// before attempting that topic's practice questions.
// type: "playlist" -> embedded as youtube.com/embed/videoseries?list=ID
// type: "video"    -> embedded as youtube.com/embed/ID

const DSA_RESOURCE = {
  type: "playlist",
  id: "PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
  label: "Complete DSA Course",
  watchUrl: "https://youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
};

const topicResources = {
  Arrays: DSA_RESOURCE,
  Strings: DSA_RESOURCE,
  "Linked List": DSA_RESOURCE,
  "Stacks & Queues": DSA_RESOURCE,
  Trees: DSA_RESOURCE,
  Graphs: DSA_RESOURCE,
  Sorting: DSA_RESOURCE,
  Searching: DSA_RESOURCE,
  "Recursion & Backtracking": DSA_RESOURCE,
  "Dynamic Programming": DSA_RESOURCE,
  "Greedy Algorithms": DSA_RESOURCE,
  Hashing: DSA_RESOURCE,
  "Bit Manipulation": DSA_RESOURCE,

  "OOP Concepts": {
    type: "video",
    id: "bSrm9RXwBaI",
    label: "OOP Concepts Explained",
    watchUrl: "https://youtu.be/bSrm9RXwBaI",
  },

  DBMS: {
    type: "playlist",
    id: "PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y",
    label: "DBMS Course — Gate Smashers",
    watchUrl: "https://youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y",
  },

  "Operating Systems": {
    type: "playlist",
    id: "PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
    label: "Operating System (Complete Playlist) — Gate Smashers",
    watchUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
  },

  "Computer Networks": {
    type: "playlist",
    id: "PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_",
    label: "Computer Networks (Complete Playlist) — Gate Smashers",
    watchUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_",
  },
};

function getEmbedUrl(resource) {
  if (!resource) return null;
  if (resource.type === "playlist") {
    return `https://www.youtube.com/embed/videoseries?list=${resource.id}`;
  }
  return `https://www.youtube.com/embed/${resource.id}`;
}

module.exports = { topicResources, getEmbedUrl };
