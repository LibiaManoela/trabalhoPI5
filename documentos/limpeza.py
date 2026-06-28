import pandas as pd
import re
from pathlib import Path

# Carregar o dataset
base_dir = Path(__file__).resolve().parent
csv_path = base_dir / 'Healthcare.csv'
txt_path = base_dir / 'meus_casos.txt'
df = pd.read_csv(csv_path)

# Filtrar apenas as doenças desejadas
#doencas_alvo = ['Diabetes', 'Hypertension', 'Thyroid Disorder']
#df_filtrado = df[df['Disease'].isin(doencas_alvo)]

# Selecionar colunas relevantes
df_selecionado = df[['Patient_ID','Age','Gender','Symptoms','Symptom_Count','Disease']].copy()

# Dicionário de tradução para sintomas e doenças
traducoes = {
    # Doenças (Diagnósticos)
    "Thyroid Disorder": "Distúrbio da Tireoide",
    "Diabetes": "Diabetes Mellitus",
    "Hypertension": "Hipertensão Arterial",

    # Sintomas
    "insomnia": "insônia",
    "back pain": "dor nas costas",
    "weight loss": "perda de peso",
    "diarrhea": "diarreia",
    "nausea": "náusea",
    "runny nose": "coriza",
    "joint pain": "dor nas articulações",
    "shortness of breath": "falta de ar",
    "depression": "depressão",
    "tremors": "tremores",
    "sore throat": "dor de garganta",
    "appetite loss": "perda de apetite",
    "cough": "tosse",
    "rash": "erupção cutânea",
    "muscle pain": "dor muscular",
    "anxiety": "ansiedade",
    "weight gain": "ganho de peso",
    "chest pain": "dor no peito",
    "headache": "dor de cabeça",
    "swelling": "inchaço",
    "blurred vision": "visão embaçada",
    "vomiting": "vômito",
    "sneezing": "espirros",
    "fatigue": "fadiga",
    "sweating": "suor excessivo",
    "abdominal pain": "dor abdominal",
    "dizziness": "tontura",
    "fever": "febre"
}

def traduzir_caso(texto_original, dicionario):
    texto_traduzido = texto_original

    # Substitui cada termo do dicionário no texto, ignorando maiúsculas/minúsculas
    for termo_en, termo_pt in dicionario.items():
        padrao = re.compile(rf"\b{re.escape(termo_en)}\b", flags=re.IGNORECASE)
        texto_traduzido = padrao.sub(termo_pt, texto_traduzido)

    return texto_traduzido

# Traduzir colunas para uso posterior
df_selecionado['Symptoms_PT'] = df_selecionado['Symptoms'].astype(str).apply(lambda texto: traduzir_caso(texto, traducoes))
df_selecionado['Disease_PT'] = df_selecionado['Disease'].astype(str).apply(lambda texto: traducoes.get(texto, texto))

# Exemplo de uso:
caso_exemplo = 'Paciente, 76 anos, sintomas: insomnia, back pain, weight loss, diagnóstico confirmado de Thyroid Disorder.'
print(traduzir_caso(caso_exemplo, traducoes))
# Resultado: Paciente, 76 anos, sintomas: insônia, dor nas costas, perda de peso, diagnóstico confirmado de Distúrbio da Tireoide.

with open(txt_path, 'w', encoding='utf-8') as f:
    for index, row in df_selecionado.iterrows():
        sintomas_traduzidos = row['Symptoms_PT']
        doenca_traduzida = row['Disease_PT']
        linha = f"Paciente, {row['Age']} anos, sintomas: {sintomas_traduzidos}, diagnóstico confirmado de {doenca_traduzida}.\n"
        f.write(linha)
