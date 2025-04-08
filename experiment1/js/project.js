// project.js - purpose and description here
// Author: Junyao Lin
// Date: 4/7/2025

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// project.js - Modified Glitch generator code for Experiment 1
// Author: Your Name
// Date: 4/7/2025

// Define the fillers object which holds arrays of words for each placeholder.
const fillers = {
  dishAdj: ["Mysterious", "Suspicious", "Unidentifiable", "Secret", "Forgotten", "Cursed", "Forbidden", "Haunted", "Enchanted", "Unholy", "Questionable"],
  dishMain: ["Soup", "Stew", "Pasta", "Sandwich", "Curry", "Salad", "Burger", "Pizza", "Pie", "Cake", "Sushi", "Hotpot"],
  chefSpecial: ["Chef's Tears", "Dragon Meat", "Goblin's Toe", "Alien Eggs", "Expired Milk", "Grandma's Secret", "Unknown Meat", "Phantom Cheese", "Ghost Pepper", "Magic Mushrooms", "Glowing Fish"],
  reaction: ["terrifies", "puzzles", "amazes", "worries", "delights", "disturbs", "fascinates", "unsettles", "confounds"],
  sideDish: ["with mysterious sauce", "served on a haunted plate", "paired with invisible fries", "garnished with suspicious herbs", "topped with cursed cheese", "with a side of existential dread", "and sprinkled with regret"],
  recommendedBy: ["our questionable chef", "the health inspector", "local witches", "anonymous food critics", "the ghost in the kitchen", "the creepy regular customer", "a very unreliable source"],
  warning: ["Eat at your own risk!", "Results may vary!", "No refunds!", "Customer satisfaction uncertain!", "Side effects unknown!", "You've been warned!", "Proceed cautiously!"],
};

// Define the template string that uses placeholders for generating the menu text.
const template = `
Today's Special: "$dishAdj $dishMain"

Prepared exclusively with $chefSpecial, this dish $reaction our customers. It is carefully $sideDish. Highly recommended by $recommendedBy.

Note: $warning
`;

// Regular expression to match placeholders like $dishAdj.
const slotPattern = /\$(\w+)/;

// Replacer function picks a random word from the fillers for a given placeholder.
function replacer(match, name) {
  let options = fillers[name];
  if (options) {
    return options[Math.floor(Math.random() * options.length)];
  } else {
    return `<UNKNOWN:${name}>`;
  }
}

// Generate function: replaces all placeholders in the template with randomly chosen words.
function generate() {
  let story = template;
  while (story.match(slotPattern)) {
    story = story.replace(slotPattern, replacer);
  }
  // Update the text content of the #box element using jQuery.
  $("#box").text(story);
}

// Wait until document is ready to bind events and initialize.
$(document).ready(function(){
  $("#clicker").click(generate); // Bind click event to reroll button.
  generate(); // Generate an initial menu when the page loads.
});
