function word_pairs() {

  var ueq_en = {
    "type" : "two_type_7",
    "title" : "UEQ (en)",
    "pairs": [
      ["annoying", "enjoyable"],
      ["not understandable", "understandable"],
      ["creative", "dull"],
      ["easy to learn", "difficult to learn"],
      ["valuable", "inferior"],
      ["boring", "exciting"],
      ["not interesting", "interesting"],
      ["unpredictable", "predictable"],
      ["fast", "slow"],
      ["inventive", "conventional"],
      ["obstructive", "supportive"],
      ["good", "bad"],
      ["complicated", "easy"],
      ["unlikable", "pleasing"],
      ["usual", "leading edge"],
      ["unpleasant", "pleasant"],
      ["secure", "not secure"],
      ["motivating", "demotivating"],
      ["meets expectations", "does not meet expectations"],
      ["inefficient", "efficient"],
      ["clear", "confusing"],
      ["impractical", "practical"],
      ["organized", "cluttered"],
      ["attractive", "unattractive"],
      ["friendly", "unfriendly"],
      ["conservative", "innovative"]
    ]
  }

  var ueq_de = {
    "type" : "two_type_7",
    "title" : "UEQ (de)",
    "pairs": [
      ["unerfreulich", "erfreulich"],
      ["unverständlich", "verständlich"],
      ["kreativ", "phantasielos"],
      ["leicht zu lernen", "schwer zu lernen"],
      ["wertvoll", "minderwertig"],
      ["langweilig", "spannend"],
      ["uninteressant", "interessant"],
      ["unberechenbar", "voraussagbar"],
      ["schnell", "langsam"],
      ["originell", "konventionell"],
      ["behindernd", "unterstützend"],
      ["gut", "schlecht"],
      ["kompliziert", "einfach"],
      ["abstoßend", "anziehend"],
      ["herkömmlich", "neuartig"],
      ["unangenehm", "angenehm"],
      ["sicher", "unsicher"],
      ["aktivierend", "einschläfernd"],
      ["erwartungskonform", "nicht erwartungskonform"],
      ["ineffizient", "effizient"],
      ["übersichtlich", "verwirrend"],
      ["unpragmatisch", "pragmatisch"],
      ["aufgeräumt", "überladen"],
      ["attraktiv", "unattraktiv"],
      ["sympathisch", "unsympathisch"],
      ["konservativ", "innovativ"]
    ]
  }

  var meCUE_en = {
    "type" : "single_type_7",
    "title" : "meCUE 2.0 (en)",
    "sentiments": [
      "The product is easy to use.",
      "The functions of the product are exactly right for my goals.",
      "It is quickly apparent how to use the product.",
      "I consider the product extremely useful.",
      "The operating procedures of the product are simple to understand.",
      "With the help of this product I will achieve my goals."
    ],
    "options": [
      "strongly disagree",
      "disagree",
      "somewhat disagree",
      "neither agree nor disagree",
      "somewhat agree",
      "agree",
      "strongly agree"
    ]
  }

  var meCUE_de = {
    "type" : "single_type_7",
    "title" : "meCUE 2.0 (de)",
    "sentiments": [
      "Das Produkt lässt sich einfach benutzen.",
      "Die Funktionen des Produkts sind genau richtig für meine Ziele.",
      "Es wird schnell klar, wie man das Produkt bedienen muss.",
      "Ich halte das Produkt für absolut nützlich.",
      "Die Bedienung des Produkts ist verständlich.",
      "Mithilfe des Produkts kann ich meine Ziele erreichen."
    ],
    "options": [
      "lehne völlig ab",
      "lehne ab",
      "lehne eher ab",
      "weder noch",
      "stimme eher zu",
      "stimme zu",
      "stimme völlig zu"
    ]
  }

  var VisAWIs_en = {
    "type" : "single_type_7",
    "title" : "VisAWI-S (en)",
    "sentiments": [
      "Everything goes together on this site.",
      "The layout is pleasantly varied.",
      "The color composition is attractive.",
      "The layout appears professionally designed."
    ],
    "options": [
      "strongly disagree",
      "disagree",
      "somewhat disagree",
      "neither agree nor disagree",
      "somewhat agree",
      "agree",
      "strongly agree"
    ]
  }

  var VisAWIs_de = {
    "type" : "single_type_7",
    "title" : "VisAWI-S (de)",
    "sentiments": [
      "Auf der Seite passt alles zusammen.",
      "Das Layout ist angenehm vielseitig.",
      "Die farbliche Gesamtgestaltung wirkt attraktiv.",
      "Das Layout ist professionell."
    ],
    "options": [
      "lehne völlig ab",
      "lehne ab",
      "lehne eher ab",
      "weder noch",
      "stimme eher zu",
      "stimme zu",
      "stimme völlig zu"
    ]
  }

  return {
    "ueq": {
      "en": ueq_en,
      "de": ueq_de
    },
    "VisAWIs": {
      "en": VisAWIs_en,
      "de": VisAWIs_de
    },
    "meCUE": {
      "en": meCUE_en,
      "de": meCUE_de
    }
  }
}

module.exports = { word_pairs: word_pairs }
