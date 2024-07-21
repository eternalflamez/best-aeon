interface Translations {
  [key: string]: {
    english: string
    french: string
    spanish: string
    german: string
  }
}

const translations: Translations = {
  generic_error: {
    english: 'Something went wrong, please try again, or contact someone from [Rise] :(',
    french: "Il semble qu'il y ait un probleme, reessayer stp, ou contacte quelqu'un de [Rise] :(",
    spanish: 'Parece que hay un problema, por favor intentalo de nuevo, o contacta a alguien de [Rise] :(',
    german:
      'Einer Fehler ist passiert. Bitte versuche es noch einmal oder kontaktiere einen unserer [Rise] Mitarbeiter.',
  },
  staff_called: {
    english: "I've sent a message to our staff! We will get back to you as soon as the next person is available.",
    french: "J'ai envoye un message a notre team, nous tu répondras lorsque la prochaine personne sera disponible",
    spanish:
      'Mande un mensaje a nuestro personal, nos comunicaremos con tigo cuando la proxima persona este disponible!',
    german:
      'Ich habe eine Nachricht an unser Team geschickt! Bitte warte bis sich der nächste freie Mitarbeiter bei dir meldet.',
  },
  available_services: {
    english: `STEP 2: Available services 📜
Currently, we offer the following services:
🔹 Raids: Tap the "Raids" button if you are interested in raid services.
🔹 Strikes: Tap the "Strikes" button if you are interested in strike services.
🔹 Fractals: Tap the "Fractals" button if you are interested in fractal services.

After selecting a service, you can choose specific content in the next step.`,
    french: `Etape 2 : Services disponibles 📜
Actuellement, nous proposons les services suivants:
🔹 Raids: Appuie sur le bouton 'Raids' si tu es intéressé par les services de raid.
🔹 Missions d'attaque: Appuie sur le bouton 'Strikes' si tu es intéressé par les services des missions d'attaque.
🔹 Fractales des Brumes: Appuie sur le bouton 'Fractals' si tu es intéressé par les services des Fractales des Brumes.

Après avoir sélectionné un service, tu peux choisir plus spécifique à l'étape suivante.`,
    spanish: `Segundo Paso: Servicios disponibles 📜 
Actualmente ofrecemos los siguientes servicios:
🔹 Incursiones: Toqua el botón 'Raids' si estas interesado en los servicios de incursiónes.
🔹 Misiones de ataque: Toqua el botón 'Strikes' si estas interesado en los servicios de misiones de ataque.
🔹 Fractales de la Niebla: Toqua el botón 'Fractals' si estas interesado en los servicios de Fractales de la Niebla.

Después de seleccionar un servicio, puedes elegir logros específicos en el siguiente paso.`,
    german: `SCHRITT 2: Angebotene Leistungen 📜
Momentan bieten wir folgende Leistungen an:
🔹 Schlachtzüge: Drücke den  "Raids" Knopf falls du dich über unsere Schlachtzugsangebote informieren möchstest.
🔹 Angriffsmissionen: Drücke den  "Strikes" Knopf falls du dich über unsere Angriffsmissionenangebote informieren möchtest.
🔹 Fraktale: Drücke den "Fractals" Knopf falls du dich über unsere Fraktalangebote informieren möchtest.

Nach diesem Schritt kannst du die Auswahl noch weiter spezifizieren.`,
  },
  raid_list: {
    english: `STEP 3: Specify Your Needs 🔎
Specify the content you're looking for within the chosen service category.

🔹 Boss Kills: Tap the "Boss Kills" button if you are interested in normal mode (NM) or challenge mode (CM) boss kills.
🔹Achievement: Tap the "Achievement" button if you are interested in specific achievements. `,
    french: `Etape 3 : précise tes besoins 🔎
Precise ce que tu cherches dans la catégorie de service choisie.

🔹 Boss Kills: Appuie sur le bouton 'Boss Kills' si t'es intéressé par les boss kills en mode normal (NM) ou en mode defi (CM).
🔹 Succes: Appuie sur le bouton 'Achievements' si t'es intéressé par succes specifiques.`,
    spanish: `Tercer Paso: Especifica! 🔎 
Especifica que es lo que estas buscando en esta categoria de servicio.

🔹 Boss Kills: Toqua el botón 'Boss Kills' si estas interesado en un boss de incursiones en modo normal (NM) o modo desafio (CM).
🔹 Logros: Toqua el botón 'Achievements' si estas interesado en logros especificos.`,
    german: `SCHRITT 3: Spezifiziere deinen Wunsch 🔎
Spezifiziere bitte genau, nach was du in der ausgewählten Kategorie suchst.

🔹 Boss Kills: Drücke den "Boss Kills" Knopf falls du Bosse im normalen Modus normal mode (NM) oder im Herausforderungsmodus challenge mode (CM) besiegen musst.
🔹 Erfolg: Drück den "Achievement" Knopf Falls du nach spezifischen Erfolgen suchst. `,
  },
  call_to_action: {
    english: `STEP 4:  Further actions 👣
Your selections have been registered. What would you like to do next?

🔹 Return: Go back to the start to explore more options.
🔹 Buy: Proceed with your purchase.
🔹 Ask: Need help? Our [Rise] support team is here for you!`,
    french: `Etape 4 : Actions supplémentaires 👣 
Tes selections ont ete enregistrées. Que veux-tu faire ensuite?
🔹 Retour: Reviens au début pour explorer plus d'options.
🔹 Acheter : Procede a votre achat.
🔹 Demandez : Besoin d'aide ? Notre équipe d'assistance de [Rise] est là pour vous !`,
    spanish: `Ultimo Paso: Proximas opciones 👣 
Tus selecciones han sido registradas. Que te gustaria hacer ahora?
🔹 Regresar: regresa al principio para explorar otras opciones.
🔹 Comprar: continua con tu compra.
🔹 Pregunta: Necesitas ayuda? Nuestro equipo de soporte de [Rise] esta aqui para ayudarte!`,
    german: `SCHRITT 4:  Checkout 👣
Deine Auswahl wurde registriert. Was würdest du gerne als nächstes tun?

🔹 Zurück: Geh zurück zur ersten Auswahl um weitere Angebote durchzustöbern.
🔹 Kaufen: Vollführe deinen Einkauf.
🔹 Fragen: Brauchst du Hilfe? unser [Rise] support team ist für dich da!`,
  },
  return: {
    english: 'Return',
    french: 'Retour',
    spanish: 'Regresar',
    german: 'Zurück',
  },
  buy: {
    english: 'Buy',
    french: 'Acheter',
    spanish: 'Comprar',
    german: 'Kaufen',
  },
  ask: {
    english: 'Ask',
    french: 'Demandez',
    spanish: 'Pregunta',
    german: 'Fragen',
  },
}

export default translations
