import React, { useState, useEffect } from "react";
import "./PredQuestGame.css";

interface Impact {
  type: string;
  value: string;
  position: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface Challenge {
  title: string;
  question: string;
  options?: string[];
  correctAnswer: number;
  impact: { type: string; value: string };
}

interface QuestStep {
  type: string;
  content: string;
  impact?: { type: string; value: string };
}

interface Quest {
  title: string;
  description: string;
  steps: QuestStep[];
}

interface Scenario {
  id: number;
  title: string;
  description: string;
}

const PredQuestGame: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<number>(1);
  const [currentPosition, setCurrentPosition] = useState<string>("DÉBUT");
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [showChallenge, setShowChallenge] = useState<boolean>(false);
  const [showQuest, setShowQuest] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [goldTokens, setGoldTokens] = useState<number>(0);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [questStep, setQuestStep] = useState<number>(0);
  const [questCards, setQuestCards] = useState<QuestStep[]>([]);

  // Données des défis (selon OA_SG_Défis.pdf)
  const challenges: Record<string, Challenge> = {
    A: {
      title: "Saisie de la demande",
      question: "Où la demande de test peut-elle être consultée ?",
      options: [
        "Consultée dans Teams",
        "Consultée dans les fichiers de suivi et prochainement dans un outil digital via une notification",
        "Consultée dans mes mails",
      ],
      correctAnswer: 1,
      impact: { type: "Echanges inutiles", value: "1h" },
    },
    B: {
      title: "Planification des tests",
      question:
        "Après validation de prise en charge du testing suite à l'étude de faisabilité, quelle action doit être engagée ?",
      options: [
        "Effectuer la demande de pesée pour envoi au labo",
        "Faire valider par le toxicologue",
        "Archiver la demande",
      ],
      correctAnswer: 0,
      impact: { type: "Temps de traversée", value: "2h" },
    },
    C: {
      title: "Réception échantillons",
      question:
        "Pourquoi est-il important d'envoyer une confirmation de réception après avoir reçu les échantillons ?",
      options: [
        "Pour informer le moniteur d'étude qui doit renseigner l'info dans le système informatique",
        "Pour informer le demandeur que les échantillons sont arrivés en bon état",
        "Ce n'est pas nécessaire d'envoyer une confirmation de réception",
      ],
      correctAnswer: 0,
      impact: { type: "Temps de traversée", value: "1h" },
    },
    D: {
      title: "Réalisation des tests",
      question:
        "Quelles informations sont à renseigner sur le fichier de suivi lors de la réalisation des tests ?",
      options: [
        "Date de début et de fin de test",
        "Date prévisionnelle d'envoi du rapport",
        "Ajout d'un commentaire en cas de problème technique",
        "Toutes les réponses ci-dessus",
      ],
      correctAnswer: 3,
      impact: { type: "Echanges inutiles", value: "2h" },
    },
    E: {
      title: "Génération du rapport",
      question:
        "Quelle est l'importance du rapport final dans le processus de testing ?",
      options: [
        "Il sert uniquement à être archivé",
        "Il fournit une documentation officielle des résultats et conclusions",
        "Il n'est pas d'une importance capitale",
      ],
      correctAnswer: 1,
      impact: { type: "Echanges inutiles", value: "1h" },
    },
    F: {
      title: "Réception rapport & synthèse",
      question:
        "Quel est l'objectif d'élaborer une synthèse après avoir reçu le rapport final ?",
      options: [
        "Pour présenter les résultats de manière concise et intelligible pour le référent ou le demandeur",
        "Pour remplacer le rapport final",
        "L'élaboration d'une synthèse n'est pas obligatoire",
      ],
      correctAnswer: 0,
      impact: { type: "Echanges inutiles", value: "1.5h" },
    },
    G: {
      title: "Transmission rapport à logistique",
      question:
        "Pourquoi est-il nécessaire de transmettre les rapports finaux à la logistique ?",
      options: [
        "Pour qu'ils puissent archiver les rapports",
        "Pour qu'ils puissent demander des tests supplémentaires",
        "Cette étape est optionnelle",
      ],
      correctAnswer: 0,
      impact: { type: "Echanges inutiles", value: "2h" },
    },
    // Autres défis...
  };

  // Données des quêtes
  const quests: Record<string, Quest> = {
    "1": {
      title: "Le Grand Tri",
      description:
        "Examiner plusieurs cartes représentant des demandes PredTest et identifier lesquelles sont conformes.",
      steps: [
        {
          type: "instruction",
          content:
            "Vous devez examiner plusieurs cartes représentant des demandes PredTest. Parmi ces demandes, certaines ne sont pas conformes. Vous disposez de 10 minutes pour passer en revue toutes les demandes et identifier lesquelles sont conformes.",
        },
        {
          type: "card",
          content:
            "Jules a besoin de générer du testing pour une étude de screening sur un projet anti-âge incluant du test interne et externe. Il a généré une demande sur Expertise Request. Voici les éléments transmis via la demande Expertise Request: 1) Disponibilité de la MP chez Evotech, 2) Code projet, 3) Fiche de sécurité (FDS), 4) Informations sur les budgets",
        },
        {
          type: "card",
          content:
            "Jules a besoin de générer du testing pour une étude de screening sur un projet anti-âge. Il a envoyé un mail à l'équipe TOM. Voici les éléments transmis: 1) Disponibilité de la MP chez Evotech, 2) Code projet, 3) Fiche de sécurité (FDS), 4) Informations sur les budgets",
        },
        {
          type: "card",
          content:
            "Jules a besoin de générer du testing pour une étude de screening sur un projet anti-âge. Il a généré une demande sur Expertise Request. Voici les éléments transmis via la demande Expertise Request: 1) Disponibilité de la MP chez Evotech, 2) Code projet, 3) Fiche de sécurité (FDS), 4) Informations sur les budgets, 5) Poids moléculaire",
        },
        {
          type: "card",
          content:
            "Jules a besoin de générer du testing pour une étude de screening sur un projet anti-âge. Il a généré une demande sur Expertise Request. Voici les éléments transmis via la demande Expertise Request: 1) Disponibilité de la MP chez Evotech, 2) Conditions de stockage, 3) Fiche de sécurité (FDS), 4) Informations sur les budgets, 5) Poids moléculaire",
        },
        {
          type: "card",
          content:
            "Jules a besoin de générer du testing pour une étude de screening sur un projet anti-âge incluant du test interne et externe. Il a généré une demande sur Expertise Request. Voici les éléments transmis via la demande Expertise Request: 1) Disponibilité de la MP chez Evotech, 2) Code projet, 3) Fiche de sécurité (FDS), 4) Informations sur les budgets, 5) Solubilité, 6) Poids moléculaire",
        },
        {
          type: "answer",
          content: "Les demandes conformes sont les cartes n°1 et n°5",
          impact: { type: "Echanges inutiles", value: "2h" },
        },
      ],
    },
    "2": {
      title: "Chrono Séquence",
      description:
        "Réorganiser les étapes du processus dans le bon ordre, tout en évitant les étapes incorrectes.",
      steps: [
        {
          type: "instruction",
          content:
            "Après avoir transmis la synthèse des résultats au référent ou au demandeur, Thomas, moniteur d'étude se rend compte que certaines étapes du processus ont mystérieusement été mélangées et des actions erronées s'y sont glissées. Vous devez réorganiser les étapes du processus dans le bon ordre, tout en évitant les étapes incorrectes.",
        },
        { type: "card", content: "Réceptionner la commande MyMarket" },
        {
          type: "card",
          content: "Transmission des rapports finaux à la logistique",
        },
        { type: "card", content: "Archivage du rapport" },
        { type: "card", content: "Sécurisation des données dans les bases" },
        { type: "card", content: "Elaboration de la synthèse" },
        { type: "card", content: "Partage de la synthèse avec le demandeur" },
        {
          type: "answer",
          content:
            "- Réception de la commande MyMarket\n- Transmission des rapports finaux à la logistique\n- Archivage du rapport\n- Sécurisation des données dans les bases",
          impact: { type: "Temps de traversée", value: "6h" },
        },
      ],
    },
    // Autres quêtes...
  };

  // Rôles disponibles dans le jeu
  const roles: Role[] = [
    { id: "moniteur", name: "MONITEUR D'ÉTUDE", color: "#4A90E2" },
    { id: "equipeTom", name: "ÉQUIPE TOM", color: "#F5A623" },
    { id: "operateur", name: "OPÉRATEUR", color: "#7ED321" },
    { id: "referent", name: "RÉFÉRENT", color: "#BD10E0" },
    { id: "cro", name: "CRO", color: "#D0021B" },
  ];

  // Attribution des rôles aux étapes
  const stageRoles: Record<string, string[]> = {
    A: ["moniteur"],
    B: ["moniteur"],
    C: ["operateur"],
    D: ["operateur"],
    E: ["moniteur"],
    F: ["moniteur"],
    G: ["moniteur"],
    H: ["equipeTom"],
    I: ["operateur"],
    J: ["moniteur"],
    K: ["referent"],
    L: ["referent"],
    M: ["referent"],
    N: ["referent"],
    O: ["moniteur"],
    P: ["moniteur"],
    Q: ["moniteur"],
    R: ["equipeTom"],
    S: ["cro"],
    T: ["cro"],
    U: ["moniteur"],
    V: ["moniteur"],
    W: ["equipeTom"],
    X: ["moniteur"],
    Y: ["moniteur"],
    Z: ["equipeTom"],
  };

  // Scénarios du jeu
  const scenarios: Scenario[] = [
    {
      id: 1,
      title: "TEST INTERNE",
      description:
        "Une nouvelle demande Support Data Gap est arrivée ! Un extrait de navet violet doit être testé rapidement par l'équipe PredTest pour s'assurer de la conformité de la demande.",
    },
    {
      id: 2,
      title: "TEST EXTERNE",
      description:
        "Une demande Best Hit arrive au sein de PredTest pour la MP longevity booster. Votre objectif est de coordonner les différentes étapes du processus tout en respectant les procédures.",
    },
  ];

  // Effet pour gérer le timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => (prevTimer !== null ? prevTimer - 1 : null));
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      if (showChallenge) {
        addImpact("Temps de traversée", "1h", currentPosition);
        alert("Temps écoulé ! Vous recevez un malus de temps de traversée +1h");
      } else if (showQuest) {
        addImpact("Temps de traversée", "2h", currentPosition);
        alert("Temps écoulé ! Vous recevez un malus de temps de traversée +2h");
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer, showChallenge, showQuest, currentPosition]);

  // Simulation d'un lancé de roue
  const spinWheel = () => {
    // Animation simple de la roue
    setWheelResult(null);

    // Simuler une animation de rotation
    let spins = 0;
    const spinInterval = setInterval(() => {
      const tempResult = Math.floor(Math.random() * 3) + 1;
      setWheelResult(tempResult);
      spins++;

      if (spins >= 10) {
        clearInterval(spinInterval);
        const finalResult = Math.floor(Math.random() * 3) + 1;
        setWheelResult(finalResult);
        setTimer(finalResult <= 2 ? 60 : 180); // 1 ou 3 minutes selon le niveau
        setIsTimerRunning(true);
      }
    }, 100);

    return true;
  };

  // Gestion des déplacements sur le plateau
  const moveToPosition = (position: string) => {
    // Réinitialiser les états précédents
    setCurrentPosition(position);
    setShowChallenge(false);
    setShowQuest(false);
    setIsTimerRunning(false);
    setTimer(null);
    setWheelResult(null);
    setUserAnswer("");
    setQuestStep(0);
    setQuestCards([]);

    // Si c'est un défi (lettre)
    if (/^[A-Z]$/.test(position)) {
      setShowChallenge(true);
    }
    // Si c'est une quête (chiffre)
    else if (/^[1-6]$/.test(position)) {
      setShowQuest(true);
      // Initialiser la quête avec ses cartes
      const questData = quests[position];
      if (questData && questData.steps) {
        setQuestCards(questData.steps);
        setTimer(600); // 10 minutes pour les quêtes
        setIsTimerRunning(true);
      }
    }
  };

  // Vérification de la réponse au défi
  const checkChallengeAnswer = () => {
    const challenge = challenges[currentPosition];
    if (!challenge) return;

    // Pour les questions à choix
    if (challenge.options) {
      const selectedOption = parseInt(userAnswer);
      if (selectedOption === challenge.correctAnswer) {
        alert("Bonne réponse !");
        // Ajouter un jeton d'or après 3 défis consécutifs réussis
        // Cette logique devrait être plus élaborée dans une implémentation complète
        if (Math.random() > 0.7) {
          // Simulé pour l'exemple
          setGoldTokens(goldTokens + 1);
          alert("Vous avez gagné un jeton d'or !");
        }
      } else {
        addImpact(
          challenge.impact.type,
          challenge.impact.value,
          currentPosition
        );
        alert(
          `Mauvaise réponse ! Vous recevez un malus: ${challenge.impact.type} +${challenge.impact.value}`
        );
      }
    }

    setIsTimerRunning(false);
    setUserAnswer("");
  };

  // Gestion de la progression des quêtes
  const nextQuestStep = () => {
    if (questStep < questCards.length - 1) {
      setQuestStep(questStep + 1);
    } else {
      // Dernière étape, valider la quête
      const answer = questCards.find((step) => step.type === "answer");
      if (answer && answer.impact) {
        addImpact(answer.impact.type, answer.impact.value, currentPosition);
      }
      setIsTimerRunning(false);
      setGoldTokens(goldTokens + 1); // Ajouter un jeton d'or pour la quête réussie
      alert("Quête terminée ! Vous recevez un jeton d'or.");
    }
  };

  // Ajouter un impact négatif
  const addImpact = (type: string, value: string, position: string) => {
    setImpacts([...impacts, { type, value, position }]);
  };

  // Utiliser un jeton d'or
  const useGoldToken = (action: string) => {
    if (goldTokens > 0) {
      setGoldTokens(goldTokens - 1);

      if (action === "hint") {
        // Logique pour donner un indice
        if (showChallenge) {
          const challenge = challenges[currentPosition];
          if (challenge) {
            alert(
              `Indice pour le défi ${currentPosition}: La réponse est liée à ${challenge.title.toLowerCase()}.`
            );
          }
        } else if (showQuest) {
          alert(
            `Indice pour la quête ${currentPosition}: Regardez attentivement chaque carte et concentrez-vous sur les détails clés.`
          );
        }
      } else if (action === "removeImpact") {
        // Supprimer le dernier impact ajouté
        if (impacts.length > 0) {
          setImpacts(impacts.slice(0, -1));
          alert("Dernier impact négatif supprimé !");
        } else {
          alert("Aucun impact à supprimer.");
          setGoldTokens(goldTokens + 1); // Rendre le jeton
        }
      } else if (action === "resetTimer") {
        // Remettre le timer à sa valeur initiale
        if (showChallenge) {
          setTimer(wheelResult !== null && wheelResult <= 2 ? 60 : 180);
          setIsTimerRunning(true);
        } else if (showQuest) {
          setTimer(600);
          setIsTimerRunning(true);
        }
        alert("Le temps a été réinitialisé !");
      }
    }
  };

  // Sélectionner/désélectionner un rôle
  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  // Vérifier les rôles sélectionnés pour l'étape courante
  const checkSelectedRoles = () => {
    const correctRoles = stageRoles[currentPosition] || [];
    let allCorrect = true;
    let missingRoles: string[] = [];
    let extraRoles: string[] = [];

    // Vérifier les rôles manquants
    correctRoles.forEach((role) => {
      if (!selectedRoles.includes(role)) {
        allCorrect = false;
        missingRoles.push(role);
      }
    });

    // Vérifier les rôles en trop
    selectedRoles.forEach((role) => {
      if (!correctRoles.includes(role)) {
        allCorrect = false;
        extraRoles.push(role);
      }
    });

    if (allCorrect) {
      alert(
        "Bravo ! Vous avez correctement identifié les rôles pour cette étape."
      );
    } else {
      if (missingRoles.length > 0) {
        const missingRoleNames = missingRoles
          .map((id) => roles.find((r) => r.id === id)?.name)
          .join(", ");
        alert(`Il manque les rôles suivants : ${missingRoleNames}`);
      }
      if (extraRoles.length > 0) {
        const extraRoleNames = extraRoles
          .map((id) => roles.find((r) => r.id === id)?.name)
          .join(", ");
        alert(
          `Ces rôles ne devraient pas être sélectionnés : ${extraRoleNames}`
        );
      }

      addImpact("Échanges inutiles", "1h", currentPosition);
    }

    setSelectedRoles([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Entête du jeu */}
      <div className="bg-blue-800 text-white p-4 flex justify-between items-center">
        <div className="font-bold text-2xl">PredQuest</div>
        <div className="flex items-center space-x-4">
          <div>
            <span className="font-bold">Scénario:</span>
            <select
              className="ml-2 bg-white text-blue-800 rounded p-1"
              value={currentScenario}
              onChange={(e) => setCurrentScenario(parseInt(e.target.value))}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.id}: {scenario.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="font-bold">Jetons d'or:</span> {goldTokens}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Plateau de jeu (côté gauche) */}
        <div className="w-2/3 p-4 overflow-auto">
          <div className="relative bg-white rounded-lg shadow-lg p-6 h-full">
            {/* Plateau basé sur OA_SG_Plateau_Réponse.pdf */}
            <div className="relative w-full h-full">
              {/* Structure du plateau */}
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 800"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Légende */}
                <g transform="translate(20, 20)">
                  <rect
                    x="0"
                    y="0"
                    width="80"
                    height="30"
                    fill="#E5E7EB"
                    rx="4"
                  />
                  <text
                    x="40"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    EXTERNE
                  </text>

                  <rect
                    x="100"
                    y="0"
                    width="80"
                    height="30"
                    fill="#FDE68A"
                    rx="4"
                  />
                  <text
                    x="140"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    INTERNE
                  </text>

                  <rect
                    x="200"
                    y="0"
                    width="80"
                    height="30"
                    fill="#93C5FD"
                    rx="4"
                  />
                  <text
                    x="240"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    SUPPORT
                  </text>

                  <rect
                    x="300"
                    y="0"
                    width="80"
                    height="30"
                    fill="#BEF264"
                    rx="4"
                  />
                  <text
                    x="340"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    SSBD
                  </text>
                </g>

                {/* Flux principal */}
                <g transform="translate(50, 100)">
                  {/* Début */}
                  <rect
                    x="0"
                    y="0"
                    width="70"
                    height="50"
                    fill="#2563EB"
                    rx="8"
                    className={`cursor-pointer ${
                      currentPosition === "DÉBUT"
                        ? "stroke-yellow-400 stroke-4"
                        : "stroke-transparent"
                    }`}
                    onClick={() => moveToPosition("DÉBUT")}
                  />
                  <text
                    x="35"
                    y="30"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontWeight="bold"
                  >
                    DÉBUT
                  </text>

                  {/* ... (le reste du SVG) ... */}

                  {/* Définition des flèches */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                    </marker>
                  </defs>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Panneau d'information (côté droit) */}
        <div className="w-1/3 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
            {/* Affichage du scénario actuel */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Scénario {currentScenario}
              </h2>
              <p className="text-gray-700">
                {scenarios.find((s) => s.id === currentScenario)?.description}
              </p>
            </div>

            {/* Roue de la fortune */}
            {!showChallenge && !showQuest && (
              <div className="mb-4 p-3 bg-blue-100 rounded-lg flex flex-col items-center">
                <h3 className="text-lg font-bold text-blue-800 mb-2">
                  Roue de la fortune
                </h3>
                <div className="relative w-32 h-32 mb-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="#FBBF24"
                      stroke="#EAB308"
                      strokeWidth="2"
                    />
                    <circle cx="50" cy="50" r="5" fill="#1E3A8A" />

                    {/* Sections de la roue */}
                    <path
                      d="M 50 50 L 95 50 A 45 45 0 0 0 72.5 13.4 Z"
                      fill="#34D399"
                    />
                    <path
                      d="M 50 50 L 72.5 13.4 A 45 45 0 0 0 27.5 13.4 Z"
                      fill="#F87171"
                    />
                    <path
                      d="M 50 50 L 27.5 13.4 A 45 45 0 0 0 5 50 Z"
                      fill="#60A5FA"
                    />
                    <path
                      d="M 50 50 L 5 50 A 45 45 0 0 0 50 95 Z"
                      fill="#F87171"
                    />
                    <path
                      d="M 50 50 L 50 95 A 45 45 0 0 0 95 50 Z"
                      fill="#34D399"
                    />

                    {/* Numéros */}
                    <text
                      x="75"
                      y="35"
                      textAnchor="middle"
                      fill="#1E3A8A"
                      fontWeight="bold"
                      fontSize="12"
                    >
                      1
                    </text>
                    <text
                      x="50"
                      y="20"
                      textAnchor="middle"
                      fill="#1E3A8A"
                      fontWeight="bold"
                      fontSize="12"
                    >
                      2
                    </text>
                    <text
                      x="25"
                      y="35"
                      textAnchor="middle"
                      fill="#1E3A8A"
                      fontWeight="bold"
                      fontSize="12"
                    >
                      3
                    </text>
                    <text
                      x="25"
                      y="70"
                      textAnchor="middle"
                      fill="#1E3A8A"
                      fontWeight="bold"
                      fontSize="12"
                    >
                      2
                    </text>
                    <text
                      x="75"
                      y="70"
                      textAnchor="middle"
                      fill="#1E3A8A"
                      fontWeight="bold"
                      fontSize="12"
                    >
                      1
                    </text>

                    {/* Flèche (optionnelle pour l'animation) */}
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="10"
                      stroke="#1E3A8A"
                      strokeWidth="2"
                      transform={`rotate(${
                        wheelResult ? wheelResult * 120 : 0
                      }, 50, 50)`}
                    />
                  </svg>
                </div>
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                  onClick={spinWheel}
                >
                  Faire tourner la roue
                </button>
                {wheelResult && (
                  <p className="text-center font-bold mt-2 text-blue-800">
                    Résultat: Niveau {wheelResult}
                  </p>
                )}
              </div>
            )}

            {/* Affichage du défi ou de la quête en cours */}
            {showChallenge && (
              <div className="mb-4 p-3 bg-orange-100 rounded-lg">
                <h3 className="text-lg font-bold text-orange-800">
                  Défi {currentPosition}: {challenges[currentPosition]?.title}
                </h3>
                <p className="text-gray-700">
                  {challenges[currentPosition]?.question}
                </p>
                <div className="mt-2 text-orange-800">
                  <span className="font-bold">Niveau de difficulté:</span>{" "}
                  {wheelResult}
                </div>
                <div className="mt-2 text-orange-800">
                  <span className="font-bold">Temps restant:</span>{" "}
                  {timer !== null
                    ? `${Math.floor(timer / 60)}:${(timer % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "00:00"}
                </div>
                <div className="mt-3 space-y-2">
                  {challenges[currentPosition]?.options && (
                    <div className="space-y-2">
                      {challenges[currentPosition].options?.map(
                        (option, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="radio"
                              id={`option-${index}`}
                              name="challenge-option"
                              value={index}
                              checked={userAnswer === index.toString()}
                              onChange={() => setUserAnswer(index.toString())}
                              className="mr-2"
                            />
                            <label htmlFor={`option-${index}`}>{option}</label>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  <button
                    className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                    onClick={checkChallengeAnswer}
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {showQuest && (
              <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                <h3 className="text-lg font-bold text-purple-800">
                  Quête {currentPosition}: {quests[currentPosition]?.title}
                </h3>
                <p className="text-gray-700">
                  {quests[currentPosition]?.description}
                </p>
                <div className="mt-2 text-purple-800">
                  <span className="font-bold">Temps restant:</span>{" "}
                  {timer !== null
                    ? `${Math.floor(timer / 60)}:${(timer % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "00:00"}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 bg-white border border-purple-300 rounded min-h-24">
                    {questCards.length > 0 && questStep < questCards.length && (
                      <div>
                        <p className="font-bold text-purple-800 mb-1">
                          {questCards[questStep].type === "instruction"
                            ? "Instructions:"
                            : questCards[questStep].type === "card"
                            ? `Carte ${questStep}:`
                            : "Réponse:"}
                        </p>
                        <p>{questCards[questStep].content}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <button
                      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                      onClick={nextQuestStep}
                    >
                      {questStep < questCards.length - 1
                        ? "Carte suivante"
                        : "Terminer la quête"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection des rôles */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-blue-800">
                Sélection des rôles
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className={`px-3 py-1 rounded text-white text-sm ${
                      selectedRoles.includes(role.id)
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                    style={{ backgroundColor: role.color }}
                    onClick={() => toggleRole(role.id)}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
              {selectedRoles.length > 0 && (
                <button
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  onClick={checkSelectedRoles}
                >
                  Assigner les rôles à l'étape {currentPosition}
                </button>
              )}
            </div>

            {/* Jetons d'or */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-blue-800">
                Actions spéciales
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className={`px-3 py-1 rounded bg-yellow-500 text-white flex items-center ${
                    goldTokens === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-yellow-600"
                  }`}
                  disabled={goldTokens === 0}
                  onClick={() => useGoldToken("hint")}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Obtenir un indice
                </button>
                <button
                  className={`px-3 py-1 rounded bg-yellow-500 text-white flex items-center ${
                    goldTokens === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-yellow-600"
                  }`}
                  disabled={goldTokens === 0}
                  onClick={() => useGoldToken("removeImpact")}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Supprimer impact
                </button>
                <button
                  className={`px-3 py-1 rounded bg-yellow-500 text-white flex items-center ${
                    goldTokens === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-yellow-600"
                  }`}
                  disabled={goldTokens === 0}
                  onClick={() => useGoldToken("resetTimer")}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Relancer timer
                </button>
              </div>
            </div>

            {/* Tableau des impacts */}
            <div className="flex-1 overflow-auto">
              <h3 className="text-lg font-bold text-blue-800">
                Tableau des impacts
              </h3>
              <table className="w-full mt-2 border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-1 text-left">Étape</th>
                    <th className="border p-1 text-left">Statut</th>
                    <th className="border p-1 text-left">Type</th>
                    <th className="border p-1 text-left">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {impacts.map((impact, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border p-1">{impact.position}</td>
                      <td className="border p-1 text-red-600">NOK</td>
                      <td className="border p-1">{impact.type}</td>
                      <td className="border p-1">{impact.value}</td>
                    </tr>
                  ))}
                  {impacts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border p-1 text-center text-gray-500"
                      >
                        Aucun impact enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredQuestGame;
