function word_pairs() {

  /*
  Marc Hassenzahl, Annika Wiklund-Engblom,
  Anette Bengs, Susanne Hägglund & Sarah Diefenbach

  (2015) Experience-Oriented and Product-Oriented Evaluation:
  Psychological Need Fulfillment, Positive Affect, and Product
  Perception, International Journal of Human-Computer Interaction,
  31:8, 530-544, DOI: 10.1080/10447318.2015.1064664
  */

  var pragmatic_quality = [
    ["human", "technical"],
    ["simple", "complicated"],
    ["practical", "impractical"],
    ["straightforward", "cumbersome"],
    ["predictable", "unpredictable"],
    ["clearly structured", "confusing"],
    ["manageable", "unruly"],
  ];

  var hedonic_quality = [
    ["connective", "isolating"],
    ["professional", "unprofessional"],
    ["stylish", "tacky"],
    ["premium", "cheap"],
    ["integrating", "alienating"],
    ["brings me closer to people", "separates me from people"],
    ["presentable", "unpresentable"],
    ["inventive", "conventional"],
    ["creative", "unimaginative"],
    ["bold", "cautious"],
    ["innovative", "conservative"],
    ["captivating", "dull"],
    ["challenging", "undemanding"],
    ["novel", "ordinary"]
  ]
   return {"pragmatic_quality" : pragmatic_quality,
           "hedonic_quality" : hedonic_quality}
}

module.exports = {word_pairs : word_pairs}
