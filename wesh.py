# -*- coding: utf-8 -*-
import sys

sys.stdout.reconfigure(encoding='utf-8')

def convert(text):
    raw = ""
    highlights = []
    i = 0

    while i < len(text):
        if i + 1 < len(text) and text[i:i+2] == "##":
            i += 2
            word = ""

            while i < len(text) and text[i:i+2] != "##":
                word += text[i]
                i += 1

            highlights.append(word)
            raw += word
            i += 2
        else:
            raw += text[i]
            i += 1

    return raw, highlights


def build_texts(list_of_texts):
    print("texts: [")
    
    for t in list_of_texts:
        raw, highlights = convert(t)

        print("  {")
        print(f"    raw: {repr(raw)},")
        print(f"    highlight: {repr(highlights)}")
        print("  },")

    print("]")


# EXEMPLE
texts_input = [
    "même si tu ##débutes##",
    "même si tu n'as pas beaucoup de ##budget##",
    "même si tu n'as pas encore de ##clients##"
]

build_texts(texts_input)




