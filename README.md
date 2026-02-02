# German Word Quiz

🌐 **[Play Online: https://wisotzky.github.io/quiz/](https://wisotzky.github.io/quiz/)**

An interactive and fun quiz game featuring a spinning wheel and multiple-choice questions to explore German culture through language. Perfect for multicultural events and family fun!

## About

This quiz was created for Multi-Cultural Night at **Burbank Elementary School, Belmont MA**. It's designed to give kids and parents a fun cultural experience by introducing them to interesting German words. Kids are encouraged to try pronouncing each word aloud before guessing its meaning!

## Features

- 🎡 **Interactive Spinning Wheel** - Spin to randomly select a German word
- 🎯 **Multiple Choice Questions** - Three options per word (one correct, two wrong)
- 🎨 **Kid-Friendly Design** - Colorful interface with emojis and animations
- 🎉 **Celebration Animations** - Confetti and encouraging messages for correct answers
- 📝 **YAML-Based Content** - Easy to customize by editing `quiz.yaml`
- 📱 **Responsive Design** - Works on desktop and tablet devices


### Customizing Content

Edit `quiz.yaml` to customize:

```yaml
title: German Word Quiz

messages:
  correctAnswer:
    - 🎉 Wunderbar! Awesome!
    - ⭐ Fantastisch! You rock!
  wrongAnswer:
    - 😢 Not quite! Try again!

words:
  Schmetterling:
    answer: 🦋 A butterfly
    wrong:
      - 🔨 A smashing sound
      - 🍦 Melting ice cream
```

## Browser Compatibility

Works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

See [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for cultural exploration and family fun!**
