import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'pt';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AED' | 'CAD' | 'AUD';
export type TimezoneCode = 'UTC' | 'EST' | 'PST' | 'GMT' | 'CET' | 'IST' | 'JST' | 'AEST' | 'GST';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  speechLang: string;
}

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rateAgainstUsd: number;
}

export interface TimezoneOption {
  code: TimezoneCode;
  label: string;
  offsetHours: number;
  timeZoneId: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English (US/UK)', nativeLabel: 'English', flag: '🇺🇸', dir: 'ltr', speechLang: 'en-US' },
  { code: 'hi', label: 'Hindi / Hinglish', nativeLabel: 'हिन्दी / Hinglish', flag: '🇮🇳', dir: 'ltr', speechLang: 'hi-IN' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', dir: 'ltr', speechLang: 'es-ES' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', dir: 'ltr', speechLang: 'fr-FR' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪', dir: 'ltr', speechLang: 'de-DE' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', dir: 'ltr', speechLang: 'ja-JP' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文', flag: '🇨🇳', dir: 'ltr', speechLang: 'zh-CN' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇦🇪', dir: 'rtl', speechLang: 'ar-SA' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷', dir: 'ltr', speechLang: 'pt-BR' },
];

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', rateAgainstUsd: 1.0 },
  { code: 'EUR', symbol: '€', label: 'Euro', rateAgainstUsd: 0.92 },
  { code: 'GBP', symbol: '£', label: 'British Pound', rateAgainstUsd: 0.79 },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', rateAgainstUsd: 83.5 },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', rateAgainstUsd: 154.0 },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', rateAgainstUsd: 3.67 },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', rateAgainstUsd: 1.36 },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', rateAgainstUsd: 1.52 },
];

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  { code: 'UTC', label: 'UTC (Coordinated Universal Time)', offsetHours: 0, timeZoneId: 'UTC' },
  { code: 'EST', label: 'EST / New York (UTC-5)', offsetHours: -5, timeZoneId: 'America/New_York' },
  { code: 'PST', label: 'PST / San Francisco (UTC-8)', offsetHours: -8, timeZoneId: 'America/Los_Angeles' },
  { code: 'GMT', label: 'GMT / London (UTC+0)', offsetHours: 0, timeZoneId: 'Europe/London' },
  { code: 'CET', label: 'CET / Berlin, Paris (UTC+1)', offsetHours: 1, timeZoneId: 'Europe/Berlin' },
  { code: 'IST', label: 'IST / New Delhi (UTC+5:30)', offsetHours: 5.5, timeZoneId: 'Asia/Kolkata' },
  { code: 'JST', label: 'JST / Tokyo (UTC+9)', offsetHours: 9, timeZoneId: 'Asia/Tokyo' },
  { code: 'AEST', label: 'AEST / Sydney (UTC+10)', offsetHours: 10, timeZoneId: 'Australia/Sydney' },
  { code: 'GST', label: 'GST / Dubai (UTC+4)', offsetHours: 4, timeZoneId: 'Asia/Dubai' },
];

// Multilingual Dictionary
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    'brand.title': 'Ardhnarishwar HR',
    'brand.subtitle': 'AI Robotics Interview System',
    'nav.dashboard': 'Executive Dashboard',
    'nav.resumes': 'Resume Shortlisting',
    'nav.schedule': 'Interview Schedule',
    'nav.live_monitor': 'Live Monitor & Recordings',
    'nav.results': 'Interview Results',
    'nav.jobs': 'Job Positions',
    'nav.ai_studio': 'AI Training Studio',
    'nav.companies': 'Tenants & Companies',
    'nav.settings': 'Admin & Email Settings',
    'nav.candidate_portal': 'Candidate Chamber',
    'auth.admin_login': 'Admin & HR Login',
    'auth.candidate_login': 'Candidate Login',
    'auth.candidate_register': 'Candidate Registration',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.cand_id': 'Candidate ID',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.job_role': 'Target Job Position',
    'auth.exp_years': 'Years of Experience',
    'auth.resume': 'Resume (PDF / DOCX)',
    'auth.skills': 'Skills (comma separated)',
    'auth.btn_login': 'Sign In Securely',
    'auth.btn_register': 'Register & Generate Interview ID',
    'chamber.title': 'AI Robotics Interview Chamber',
    'chamber.start': 'Start Live AI Interview',
    'chamber.end': 'End Interview',
    'chamber.listening': 'AI is listening...',
    'chamber.speaking': 'AI Interviewer is speaking...',
    'chamber.confidence': 'Confidence',
    'chamber.nervousness': 'Nervousness',
    'chamber.engagement': 'Engagement',
    'chat.title': 'AI Global Copilot & Recruiter Assistant',
    'chat.placeholder': 'Ask me anything about hiring, resumes, interview questions, or STAR tips...',
    'chat.recruiter_mode': 'Recruiter Assistant',
    'chat.candidate_mode': 'Candidate Coach',
    'chat.quick_questions': 'Quick Prompts',
    'chat.send': 'Send',
    'common.search': 'Search...',
    'common.refresh': 'Refresh',
    'common.export': 'Export',
    'common.status': 'Status',
    'common.score': 'Score',
    'common.actions': 'Actions',
    'common.selected': 'Selected',
    'common.rejected': 'Rejected',
    'common.pending': 'Pending',
    'common.shortlisted': 'Shortlisted',
    'common.on_hold': 'On Hold',
  },
  hi: {
    'brand.title': 'अर्धनारीश्वर HR',
    'brand.subtitle': 'AI रोबोटिक्स इंटरव्यू सिस्टम',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.resumes': 'बायोडाटा / रिज्यूम शॉर्टलिस्टिंग',
    'nav.schedule': 'इंटरव्यू शेड्यूलिंग',
    'nav.live_monitor': 'लाइव मॉनिटर व रिकॉर्डिंग्स',
    'nav.results': 'इंटरव्यू परिणाम',
    'nav.jobs': 'जॉब रिक्तियां',
    'nav.ai_studio': 'AI ट्रेनिंग स्टूडियो',
    'nav.companies': 'कंपनी व टेनेंट्स',
    'nav.settings': 'एडमिन व ईमेल सेटिंग्स',
    'nav.candidate_portal': 'उम्मीदवार पोर्टल',
    'auth.admin_login': 'एडमिन / HR लॉगिन',
    'auth.candidate_login': 'कैंडिडेट लॉगिन',
    'auth.candidate_register': 'नया उम्मीदवार पंजीकरण',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.cand_id': 'कैंडिडेट आईडी',
    'auth.name': 'पूरा नाम',
    'auth.phone': 'फोन नंबर',
    'auth.job_role': 'पद / जॉब रोल',
    'auth.exp_years': 'अनुभव (वर्ष)',
    'auth.resume': 'रिज्यूम अपलोड (PDF/DOCX)',
    'auth.skills': 'कौशल / स्किल्स (कॉमा से अलग करें)',
    'auth.btn_login': 'लॉगिन करें',
    'auth.btn_register': 'पंजीकरण करें और आईडी पाएं',
    'chamber.title': 'AI रोबोटिक्स लाइव इंटरव्यू चैंबर',
    'chamber.start': 'लाइव इंटरव्यू शुरू करें',
    'chamber.end': 'इंटरव्यू समाप्त करें',
    'chamber.listening': 'AI आपकी आवाज़ सुन रहा है...',
    'chamber.speaking': 'AI रोबोट बोल रहा है...',
    'chamber.confidence': 'आत्मविश्वास (Confidence)',
    'chamber.nervousness': 'घबराहट (Nervousness)',
    'chamber.engagement': 'सक्रियता (Engagement)',
    'chat.title': 'AI ग्लोबल कोपायलट व HR सहायक',
    'chat.placeholder': 'भर्ती, रिज्यूम, इंटरव्यू प्रश्न या टिप्स के बारे में कुछ भी पूछें...',
    'chat.recruiter_mode': 'रिक्रूटर सहायक',
    'chat.candidate_mode': 'कैंडिडेट कोच',
    'chat.quick_questions': 'त्वरित सुझाव',
    'chat.send': 'भेजें',
    'common.search': 'खोजें...',
    'common.refresh': 'ताज़ा करें',
    'common.export': 'एक्सपोर्ट करें',
    'common.status': 'स्थिति',
    'common.score': 'स्कोर',
    'common.actions': 'कार्रवाई',
    'common.selected': 'चयनित (Selected)',
    'common.rejected': 'अस्वीकृत (Rejected)',
    'common.pending': 'लंबित (Pending)',
    'common.shortlisted': 'शॉर्टलिस्टेड',
    'common.on_hold': 'होल्ड पर (On Hold)',
  },
  es: {
    'brand.title': 'Ardhnarishwar HR',
    'brand.subtitle': 'Sistema de Entrevistas Robóticas con IA',
    'nav.dashboard': 'Panel de Control',
    'nav.resumes': 'Selección de Currículums',
    'nav.schedule': 'Calendario de Entrevistas',
    'nav.live_monitor': 'Monitor en Vivo y Grabaciones',
    'nav.results': 'Resultados de Entrevistas',
    'nav.jobs': 'Puestos de Trabajo',
    'nav.ai_studio': 'Estudio de Entrenamiento IA',
    'nav.companies': 'Empresas y Clientes',
    'nav.settings': 'Configuración de Admin y Correo',
    'nav.candidate_portal': 'Cámara del Candidato',
    'auth.admin_login': 'Acceso de Administrador / RRHH',
    'auth.candidate_login': 'Acceso de Candidatos',
    'auth.candidate_register': 'Registro de Candidatos',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.cand_id': 'ID de Candidato',
    'auth.name': 'Nombre Completo',
    'auth.phone': 'Teléfono',
    'auth.job_role': 'Puesto al que Aplica',
    'auth.exp_years': 'Años de Experiencia',
    'auth.resume': 'Currículum (PDF/DOCX)',
    'auth.skills': 'Habilidades (separadas por coma)',
    'auth.btn_login': 'Iniciar Sesión',
    'auth.btn_register': 'Registrarse y Obtener ID',
    'chamber.title': 'Cámara de Entrevista con IA',
    'chamber.start': 'Iniciar Entrevista en Vivo',
    'chamber.end': 'Terminar Entrevista',
    'chamber.listening': 'La IA está escuchando...',
    'chamber.speaking': 'El entrevistador IA está hablando...',
    'chamber.confidence': 'Confianza',
    'chamber.nervousness': 'Nerviosismo',
    'chamber.engagement': 'Compromiso',
    'chat.title': 'Copiloto Global IA y Asistente de RRHH',
    'chat.placeholder': 'Pregunte sobre contratación, currículums, preguntas de entrevista o método STAR...',
    'chat.recruiter_mode': 'Asistente de Reclutador',
    'chat.candidate_mode': 'Entrenador de Candidato',
    'chat.quick_questions': 'Sugerencias Rápidas',
    'chat.send': 'Enviar',
    'common.search': 'Buscar...',
    'common.refresh': 'Actualizar',
    'common.export': 'Exportar',
    'common.status': 'Estado',
    'common.score': 'Puntuación',
    'common.actions': 'Acciones',
    'common.selected': 'Seleccionado',
    'common.rejected': 'Rechazado',
    'common.pending': 'Pendiente',
    'common.shortlisted': 'Preseleccionado',
    'common.on_hold': 'En Espera',
  },
  fr: {
    'brand.title': 'Ardhnarishwar RH',
    'brand.subtitle': 'Système d\'Entretien Robotique IA',
    'nav.dashboard': 'Tableau de Bord Exécutif',
    'nav.resumes': 'Présélection de CV',
    'nav.schedule': 'Calendrier des Entretiens',
    'nav.live_monitor': 'Moniteur en Direct & Enregistrements',
    'nav.results': 'Résultats des Entretiens',
    'nav.jobs': 'Postes Ouverts',
    'nav.ai_studio': 'Studio d\'Entraînement IA',
    'nav.companies': 'Entreprises Partenaires',
    'nav.settings': 'Paramètres Admin & E-mail',
    'nav.candidate_portal': 'Portail Candidat',
    'auth.admin_login': 'Connexion Admin / RH',
    'auth.candidate_login': 'Connexion Candidat',
    'auth.candidate_register': 'Inscription Candidat',
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de Passe',
    'auth.cand_id': 'Identifiant Candidat (ID)',
    'auth.name': 'Nom Complet',
    'auth.phone': 'Téléphone',
    'auth.job_role': 'Poste Visé',
    'auth.exp_years': 'Années d\'Expérience',
    'auth.resume': 'CV (PDF/DOCX)',
    'auth.skills': 'Compétences (séparées par virgules)',
    'auth.btn_login': 'Se Connecter',
    'auth.btn_register': 'S\'inscrire & Générer l\'ID',
    'chamber.title': 'Chambre d\'Entretien IA Robotique',
    'chamber.start': 'Démarrer l\'Entretien en Direct',
    'chamber.end': 'Terminer l\'Entretien',
    'chamber.listening': 'L\'IA écoute...',
    'chamber.speaking': 'L\'interviewer IA s\'exprime...',
    'chamber.confidence': 'Confiance',
    'chamber.nervousness': 'Nervosité',
    'chamber.engagement': 'Engagement',
    'chat.title': 'Copilote IA Global & Assistant RH',
    'chat.placeholder': 'Posez une question sur le recrutement, CV, questions d\'entretien...',
    'chat.recruiter_mode': 'Assistant Recruteur',
    'chat.candidate_mode': 'Coach Candidat',
    'chat.quick_questions': 'Suggestions Rapides',
    'chat.send': 'Envoyer',
    'common.search': 'Rechercher...',
    'common.refresh': 'Actualiser',
    'common.export': 'Exporter',
    'common.status': 'Statut',
    'common.score': 'Score',
    'common.actions': 'Actions',
    'common.selected': 'Sélectionné',
    'common.rejected': 'Rejeté',
    'common.pending': 'En Attente',
    'common.shortlisted': 'Présélectionné',
    'common.on_hold': 'En Attente',
  },
  de: {
    'brand.title': 'Ardhnarishwar HR',
    'brand.subtitle': 'KI-Robotik-Interview-System',
    'nav.dashboard': 'Dashboard',
    'nav.resumes': 'Lebenslauf-Vorauswahl',
    'nav.schedule': 'Interview-Zeitplan',
    'nav.live_monitor': 'Live-Monitor & Aufzeichnungen',
    'nav.results': 'Interview-Ergebnisse',
    'nav.jobs': 'Stellenangebote',
    'nav.ai_studio': 'KI-Trainingsstudio',
    'nav.companies': 'Unternehmen & Mandanten',
    'nav.settings': 'Admin- & E-Mail-Einstellungen',
    'nav.candidate_portal': 'Kandidatenportal',
    'auth.admin_login': 'Admin & HR Login',
    'auth.candidate_login': 'Kandidaten-Login',
    'auth.candidate_register': 'Kandidaten-Registrierung',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.cand_id': 'Kandidaten-ID',
    'auth.name': 'Vollständiger Name',
    'auth.phone': 'Telefonnummer',
    'auth.job_role': 'Angestrebte Position',
    'auth.exp_years': 'Berufserfahrung (Jahre)',
    'auth.resume': 'Lebenslauf (PDF/DOCX)',
    'auth.skills': 'Fähigkeiten (kommagetrennt)',
    'auth.btn_login': 'Sicher Anmelden',
    'auth.btn_register': 'Registrieren & ID erhalten',
    'chamber.title': 'KI-Interview-Kammer',
    'chamber.start': 'Live-Interview starten',
    'chamber.end': 'Interview beenden',
    'chamber.listening': 'KI hört zu...',
    'chamber.speaking': 'KI-Interviewer spricht...',
    'chamber.confidence': 'Selbstvertrauen',
    'chamber.nervousness': 'Nervosität',
    'chamber.engagement': 'Engagement',
    'chat.title': 'Globaler KI-Copilot & HR-Assistent',
    'chat.placeholder': 'Fragen Sie nach Rekrutierung, Lebensläufen, Interviewfragen...',
    'chat.recruiter_mode': 'Recruiter-Assistent',
    'chat.candidate_mode': 'Kandidaten-Coach',
    'chat.quick_questions': 'Schnellvorschläge',
    'chat.send': 'Senden',
    'common.search': 'Suchen...',
    'common.refresh': 'Aktualisieren',
    'common.export': 'Exportieren',
    'common.status': 'Status',
    'common.score': 'Bewertung',
    'common.actions': 'Aktionen',
    'common.selected': 'Ausgewählt',
    'common.rejected': 'Abgelehnt',
    'common.pending': 'Ausstehend',
    'common.shortlisted': 'In der engeren Auswahl',
    'common.on_hold': 'Zurückgestellt',
  },
  ja: {
    'brand.title': 'Ardhnarishwar HR',
    'brand.subtitle': 'AIロボティクス面接システム',
    'nav.dashboard': 'ダッシュボード',
    'nav.resumes': '履歴書書類選考',
    'nav.schedule': '面接スケジュール',
    'nav.live_monitor': 'ライブモニター＆録画',
    'nav.results': '面接評価結果',
    'nav.jobs': '求人ポジション',
    'nav.ai_studio': 'AI学習スタジオ',
    'nav.companies': '企業・テナント管理',
    'nav.settings': '管理者＆メール設定',
    'nav.candidate_portal': '応募者面接ルーム',
    'auth.admin_login': '管理者 / 人事ログイン',
    'auth.candidate_login': '応募者ログイン',
    'auth.candidate_register': '応募者新規登録',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.cand_id': '応募者ID',
    'auth.name': '氏名（フルネーム）',
    'auth.phone': '電話番号',
    'auth.job_role': '応募職種',
    'auth.exp_years': '経験年数',
    'auth.resume': '履歴書 (PDF/DOCX)',
    'auth.skills': 'スキル（カンマ区切り）',
    'auth.btn_login': 'ログイン',
    'auth.btn_register': '登録してIDを発行',
    'chamber.title': 'AIロボティクス面接チャンバー',
    'chamber.start': 'ライブ面接を開始',
    'chamber.end': '面接を終了',
    'chamber.listening': 'AIが音声を認識中...',
    'chamber.speaking': 'AI面接官が発言中...',
    'chamber.confidence': '自信度 (Confidence)',
    'chamber.nervousness': '緊張度 (Nervousness)',
    'chamber.engagement': 'エンゲージメント',
    'chat.title': 'AIグローバルコパイロット＆人事アシスタント',
    'chat.placeholder': '採用、履歴書、面接の質問やSTARメソッドについて質問...',
    'chat.recruiter_mode': '採用担当者アシスタント',
    'chat.candidate_mode': '応募者面接コーチ',
    'chat.quick_questions': 'クイックプロンプト',
    'chat.send': '送信',
    'common.search': '検索...',
    'common.refresh': '更新',
    'common.export': 'エクスポート',
    'common.status': 'ステータス',
    'common.score': 'スコア',
    'common.actions': '操作',
    'common.selected': '採用 (Selected)',
    'common.rejected': '不採用 (Rejected)',
    'common.pending': '審査中 (Pending)',
    'common.shortlisted': '書類通過 (Shortlisted)',
    'common.on_hold': '保留 (On Hold)',
  },
  zh: {
    'brand.title': 'Ardhnarishwar HR',
    'brand.subtitle': 'AI机器人智能面试系统',
    'nav.dashboard': '管理仪表盘',
    'nav.resumes': '简历智能筛选',
    'nav.schedule': '面试日程安排',
    'nav.live_monitor': '实时监控与录像库',
    'nav.results': '面试评估结果',
    'nav.jobs': '职位管理',
    'nav.ai_studio': 'AI模型调优室',
    'nav.companies': '企业租户管理',
    'nav.settings': '系统与邮件设置',
    'nav.candidate_portal': '候选人面试室',
    'auth.admin_login': '管理员与HR登录',
    'auth.candidate_login': '候选人登录',
    'auth.candidate_register': '候选人注册',
    'auth.email': '电子邮箱',
    'auth.password': '密码',
    'auth.cand_id': '候选人编号 (ID)',
    'auth.name': '姓名',
    'auth.phone': '联系电话',
    'auth.job_role': '应聘岗位',
    'auth.exp_years': '工作年限',
    'auth.resume': '上传简历 (PDF/DOCX)',
    'auth.skills': '专业技能 (逗号分隔)',
    'auth.btn_login': '安全登录',
    'auth.btn_register': '立即注册并获取ID',
    'chamber.title': 'AI智能视频面试室',
    'chamber.start': '开启实时AI面试',
    'chamber.end': '结束面试',
    'chamber.listening': 'AI正在聆听...',
    'chamber.speaking': 'AI面试官正在发问...',
    'chamber.confidence': '自信度 (Confidence)',
    'chamber.nervousness': '紧张度 (Nervousness)',
    'chamber.engagement': '互动度 (Engagement)',
    'chat.title': 'AI全球招聘副驾驶与智能顾问',
    'chat.placeholder': '询问招聘文案、简历建议、面试题目或STAR技巧...',
    'chat.recruiter_mode': '招聘HR助手',
    'chat.candidate_mode': '求职备考教练',
    'chat.quick_questions': '快捷提示',
    'chat.send': '发送',
    'common.search': '搜索...',
    'common.refresh': '刷新',
    'common.export': '导出',
    'common.status': '状态',
    'common.score': '得分',
    'common.actions': '操作',
    'common.selected': '录用 (Selected)',
    'common.rejected': '未通过 (Rejected)',
    'common.pending': '待处理 (Pending)',
    'common.shortlisted': '已通过初筛',
    'common.on_hold': '待定 (On Hold)',
  },
  ar: {
    'brand.title': 'أرداناريشوار للموارد البشرية',
    'brand.subtitle': 'نظام المقابلات الذكية بالذكاء الاصطناعي والروبوتات',
    'nav.dashboard': 'لوحة القيادة التنفيذية',
    'nav.resumes': 'فرز السير الذاتية بالذكاء الاصطناعي',
    'nav.schedule': 'جدول المقابلات',
    'nav.live_monitor': 'المراقبة الحية والتسجيلات',
    'nav.results': 'نتائج المقابلات',
    'nav.jobs': 'الوظائف الشاغرة',
    'nav.ai_studio': 'استوديو تدريب الذكاء الاصطناعي',
    'nav.companies': 'الشركات والمؤسسات',
    'nav.settings': 'إعدادات المشرف والبريد',
    'nav.candidate_portal': 'غرفة مقابلة المرشح',
    'auth.admin_login': 'تسجيل دخول الإدارة والموارد البشرية',
    'auth.candidate_login': 'تسجيل دخول المرشح',
    'auth.candidate_register': 'تسجيل مرشح جديد',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.cand_id': 'معرف المرشح (ID)',
    'auth.name': 'الاسم الكامل',
    'auth.phone': 'رقم الهاتف',
    'auth.job_role': 'المسمى الوظيفي المستهدف',
    'auth.exp_years': 'سنوات الخبرة',
    'auth.resume': 'السيرة الذاتية (PDF/DOCX)',
    'auth.skills': 'المهارات (مفصولة بفواصل)',
    'auth.btn_login': 'تسجيل الدخول الآمن',
    'auth.btn_register': 'تسجيل وإنشاء رمز الدخول',
    'chamber.title': 'غرفة المقابلات الذكية بالروبوت',
    'chamber.start': 'بدء المقابلة الحية',
    'chamber.end': 'إنهاء المقابلة',
    'chamber.listening': 'الذكاء الاصطناعي يستمع إليك...',
    'chamber.speaking': 'المحاور الذكي يتحدث...',
    'chamber.confidence': 'مستوى الثقة',
    'chamber.nervousness': 'التوتر والارتباك',
    'chamber.engagement': 'التفاعل والتجاوب',
    'chat.title': 'المساعد الذكي العالمي للموارد البشرية',
    'chat.placeholder': 'اسأل أي شيء حول التوظيف، السيرة الذاتية، أسئلة المقابلة...',
    'chat.recruiter_mode': 'مساعد مسؤول التوظيف',
    'chat.candidate_mode': 'مدرب المرشح للمقابلات',
    'chat.quick_questions': 'مقترحات سريعة',
    'chat.send': 'إرسال',
    'common.search': 'بحث...',
    'common.refresh': 'تحديث',
    'common.export': 'تصدير',
    'common.status': 'الحالة',
    'common.score': 'الدرجة',
    'common.actions': 'إجراءات',
    'common.selected': 'تم الاختيار والقبول',
    'common.rejected': 'غير مقبول',
    'common.pending': 'قيد الانتظار',
    'common.shortlisted': 'تم التأهيل للقائمة القصيرة',
    'common.on_hold': 'معلق مؤقتاً',
  },
  pt: {
    'brand.title': 'Ardhnarishwar RH',
    'brand.subtitle': 'Sistema de Entrevistas com Robótica e IA',
    'nav.dashboard': 'Painel Executivo',
    'nav.resumes': 'Triagem de Currículos',
    'nav.schedule': 'Agendamento de Entrevistas',
    'nav.live_monitor': 'Monitor ao Vivo e Gravações',
    'nav.results': 'Resultados das Entrevistas',
    'nav.jobs': 'Vagas Abertas',
    'nav.ai_studio': 'Estúdio de Treinamento de IA',
    'nav.companies': 'Empresas e Clientes',
    'nav.settings': 'Configurações de Admin e E-mail',
    'nav.candidate_portal': 'Portal do Candidato',
    'auth.admin_login': 'Login de Admin e RH',
    'auth.candidate_login': 'Login do Candidato',
    'auth.candidate_register': 'Cadastro de Novo Candidato',
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.cand_id': 'ID do Candidato',
    'auth.name': 'Nome Completo',
    'auth.phone': 'Telefone',
    'auth.job_role': 'Cargo Desejado',
    'auth.exp_years': 'Anos de Experiência',
    'auth.resume': 'Currículo (PDF/DOCX)',
    'auth.skills': 'Habilidades (separadas por vírgula)',
    'auth.btn_login': 'Entrar com Segurança',
    'auth.btn_register': 'Cadastrar e Gerar ID',
    'chamber.title': 'Câmara de Entrevista com IA',
    'chamber.start': 'Iniciar Entrevista ao Vivo',
    'chamber.end': 'Encerrar Entrevista',
    'chamber.listening': 'A IA está ouvindo...',
    'chamber.speaking': 'O entrevistador IA está falando...',
    'chamber.confidence': 'Confiança',
    'chamber.nervousness': 'Nervosismo',
    'chamber.engagement': 'Engajamento',
    'chat.title': 'Copiloto Global de IA e Assistente de RH',
    'chat.placeholder': 'Pergunte sobre contratação, currículos, perguntas ou método STAR...',
    'chat.recruiter_mode': 'Assistente do Recrutador',
    'chat.candidate_mode': 'Coach do Candidato',
    'chat.quick_questions': 'Sugestões Rápidas',
    'chat.send': 'Enviar',
    'common.search': 'Pesquisar...',
    'common.refresh': 'Atualizar',
    'common.export': 'Exportar',
    'common.status': 'Status',
    'common.score': 'Pontuação',
    'common.actions': 'Ações',
    'common.selected': 'Selecionado',
    'common.rejected': 'Rejeitado',
    'common.pending': 'Pendente',
    'common.shortlisted': 'Pré-selecionado',
    'common.on_hold': 'Em Espera',
  }
};

interface LanguageContextType {
  language: LanguageCode;
  currency: CurrencyCode;
  timezone: TimezoneCode;
  setLanguage: (lang: LanguageCode) => void;
  setCurrency: (curr: CurrencyCode) => void;
  setTimezone: (tz: TimezoneCode) => void;
  currentLanguageOption: LanguageOption;
  currentCurrencyOption: CurrencyOption;
  currentTimezoneOption: TimezoneOption;
  t: (key: string, defaultText?: string) => string;
  formatCurrency: (amountInUsd: number) => string;
  formatDateTime: (date: Date | string | number, formatStyle?: 'full' | 'short' | 'timeOnly') => string;
  isRTL: boolean;
  currentTimeStr: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (localStorage.getItem('ardhnarishwar_lang') as LanguageCode) || 'en';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('ardhnarishwar_curr') as CurrencyCode) || 'USD';
  });

  const [timezone, setTimezoneState] = useState<TimezoneCode>(() => {
    return (localStorage.getItem('ardhnarishwar_tz') as TimezoneCode) || 'IST';
  });

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('--:--:--');

  const currentLanguageOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const currentCurrencyOption = useMemo(() => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  }, [currency]);

  const currentTimezoneOption = useMemo(() => {
    return SUPPORTED_TIMEZONES.find(t => t.code === timezone) || SUPPORTED_TIMEZONES[0];
  }, [timezone]);

  const isRTL = currentLanguageOption.dir === 'rtl';

  // Apply HTML document direction and lang
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = currentLanguageOption.dir;
  }, [language, currentLanguageOption]);

  // Live World Clock Timer updated every second according to selected Timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: currentTimezoneOption.timeZoneId,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setCurrentTimeStr(`${timeFormatter.format(now)} (${currentTimezoneOption.code})`);
      } catch {
        const now = new Date();
        setCurrentTimeStr(now.toTimeString().split(' ')[0]);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentTimezoneOption]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('ardhnarishwar_lang', lang);
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem('ardhnarishwar_curr', curr);
  };

  const setTimezone = (tz: TimezoneCode) => {
    setTimezoneState(tz);
    localStorage.setItem('ardhnarishwar_tz', tz);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  };

  const formatCurrency = (amountInUsd: number): string => {
    const converted = amountInUsd * currentCurrencyOption.rateAgainstUsd;
    if (currentCurrencyOption.code === 'JPY') {
      return `${currentCurrencyOption.symbol}${Math.round(converted).toLocaleString()}`;
    }
    if (currentCurrencyOption.code === 'INR') {
      return `${currentCurrencyOption.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
    }
    return `${currentCurrencyOption.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDateTime = (
    dateInput: Date | string | number,
    formatStyle: 'full' | 'short' | 'timeOnly' = 'full'
  ): string => {
    try {
      const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return String(dateInput);

      if (formatStyle === 'timeOnly') {
        return new Intl.DateTimeFormat(language, {
          timeZone: currentTimezoneOption.timeZoneId,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(d);
      }

      if (formatStyle === 'short') {
        return new Intl.DateTimeFormat(language, {
          timeZone: currentTimezoneOption.timeZoneId,
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      }

      return new Intl.DateTimeFormat(language, {
        timeZone: currentTimezoneOption.timeZoneId,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return String(dateInput);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currency,
        timezone,
        setLanguage,
        setCurrency,
        setTimezone,
        currentLanguageOption,
        currentCurrencyOption,
        currentTimezoneOption,
        t,
        formatCurrency,
        formatDateTime,
        isRTL,
        currentTimeStr,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
