import { GoogleGenAI, Type } from "@google/genai";
import { DealData, DeliverableType, Slide, FileAttachment, PortfolioCompany, InvestmentMemo } from "../types";

// Helper to get client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Robust JSON Repair for Truncated Responses
const repairJSON = (jsonString: string): string => {
    let repaired = jsonString.trim();
    
    // 1. Check if it ends with a dangling comma (common before a truncation)
    if (repaired.endsWith(',')) {
        repaired = repaired.slice(0, -1);
    }

    // 2. Check for unclosed strings
    // Count quotes that aren't escaped
    let quoteCount = 0;
    for (let i = 0; i < repaired.length; i++) {
        if (repaired[i] === '"' && (i === 0 || repaired[i-1] !== '\\')) {
            quoteCount++;
        }
    }
    if (quoteCount % 2 !== 0) {
        repaired += '"';
    }

    // 3. Balance Braces/Brackets using a stack
    const stack: string[] = [];
    // We only care about structural characters outside of strings, but complex parsing is hard.
    // Simple approach: Iterate chars. If inside string, ignore structure.
    
    let insideString = false;
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '"' && (i === 0 || repaired[i-1] !== '\\')) {
            insideString = !insideString;
            continue;
        }
        
        if (!insideString) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}' || char === ']') {
                // If we encounter a closer, pop the expected closer from stack to verify
                // If stack is empty or mismatch, it's just malformed, but we continue
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                }
            }
        }
    }

    // Append all missing closers in reverse order
    while (stack.length > 0) {
        repaired += stack.pop();
    }

    return repaired;
};

// Helper to clean and parse JSON that might contain markdown blocks or extra whitespace
const cleanAndParseJSON = (text: string): any => {
    if (!text) return {};
    // Remove markdown code blocks if present (e.g. ```json ... ```)
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Attempt to find the first '{' and last '}' (or '[' and ']') to handle preamble/postscript text
    const firstCurly = cleanText.indexOf('{');
    const firstSquare = cleanText.indexOf('[');

    let start = -1;
    if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
        start = firstCurly;
    } else if (firstSquare !== -1) {
        start = firstSquare;
    }

    if (start !== -1) {
        cleanText = cleanText.substring(start);
    }
    
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // First failure: Try simple repair (trimming trailing chars)
        try {
            const repaired = repairJSON(cleanText);
            return JSON.parse(repaired);
        } catch (repairError) {
             console.error("JSON Parse Error on text:", text);
             console.error("Repaired Attempt:", repairJSON(cleanText));
             throw new Error(`JSON Parse Failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
};

// Data Sanitizer to prevent UI crashes
const sanitizeDealData = (data: any, companyName: string): DealData => {
    const defaultMemo: InvestmentMemo = {
        executiveSummary: "Pending generation...",
        investmentRecommendation: "HOLD",
        recommendationRationale: "Insufficient data for recommendation.",
        dealMerits: [],
        investmentThesis: [],
        keyRisks: [],
        riskMitigation: "N/A",
        marketOverview: "N/A",
        competitiveLandscape: "N/A",
        customerAnalysis: "N/A",
        operationalUpside: "N/A"
    };

    return {
        companyName: data.companyName || companyName || "Target Company",
        sector: data.sector || "Unknown Sector",
        location: data.location || "N/A",
        ebitda: data.ebitda || 0,
        revenue: data.revenue || 0,
        askingMultiple: data.askingMultiple || 0,
        impliedValue: data.impliedValue || 0,
        financialModels: data.financialModels || {
            years: ["LTM"],
            incomeStatement: { title: "Income Statement", rows: [] },
            balanceSheet: { title: "Balance Sheet", rows: [] },
            cashFlow: { title: "Cash Flow", rows: [] }
        },
        lboModel: data.lboModel || {
            entryMultiple: 0,
            exitMultiple: 0,
            irr: 0,
            moic: 0,
            debttoEquity: 0
        },
        lboDetailed: data.lboDetailed || {
            assumptions: [],
            sources: [],
            uses: [],
            debtSchedule: { title: "Debt Schedule", rows: [] },
            projectedReturns: { title: "Returns", rows: [] }
        },
        memo: { ...defaultMemo, ...(data.memo || {}) },
        sensitivityAnalysis: data.sensitivityAnalysis || [],
        comparables: data.comparables || [],
        candidatesAnalyzed: data.candidatesAnalyzed || [],
        groundingUrls: data.groundingUrls || [],
        deliverables: data.deliverables || []
    };
};

/**
 * MD Agent: Strategy & Mandate Check
 */
export const getMDStrategy = async (userPrompt: string, mandate: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Prompt: "${userPrompt}"
      
      FIRM HISTORICAL MANDATE: "${mandate}"
      
      Your Role: Managing Director at DiDi AI. 
      Task: Analyze the user's request. 
      
      CRITICAL INSTRUCTION:
      The user is the final decision maker. If the user wants to pivot strategies (e.g., from Healthcare to AI, or Industrials to Tech), YOU MUST ALLOW IT.
      Do not block the request based on the historical mandate. Instead, acknowledge the pivot and define a strategy for the NEW request.
      
      Output:
      1. Acknowledge the user's intent.
      2. If it differs from the historical mandate, note it as a "Strategic Pivot" but proceed enthusiastically.
      3. Define a SPECIFIC search strategy for the Scout Agent (keywords, sectors, financial criteria).
      
      FORMATTING RULES:
      - Use **bold** for key terms.
      - Use ### for Section Headers.
      - Use - for bullet points.
      - Keep it brief and authoritative.`,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (!response.text) throw new Error("Empty response from MD Agent");
    return response.text;
  } catch (error) {
    throw new Error(`MD Strategy Generation Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Scout Agent: Broad Sourcing
 */
export const scoutPotentialTargets = async (strategyDirective: string): Promise<string[]> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Scout Agent for DiDi AI.
      MD Directive: ${strategyDirective}.
      
      Task: Search the LIVE WEB for 5 real, existing private or public companies that fit this criteria.
      Focus on companies with recent news, funding, or market activity.
      
      CRITICAL: Return ONLY a raw JSON array of strings with their names. 
      Do NOT write any introductory text. 
      Just the array.
      
      Example: ["Company A", "Company B", "Company C"]`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text || "[]";
    const jsonMatch = text.match(/\[.*?\]/s);
    if (jsonMatch) {
        text = jsonMatch[0];
    }

    const json = cleanAndParseJSON(text);
    if (!Array.isArray(json)) throw new Error("Parsed output is not an array");
    return json;
  } catch (error) {
    throw new Error(`Scouting Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * VP Agent: Target Selection
 */
export const selectBestTarget = async (targets: string[], mandate: string): Promise<string> => {
    try {
        if (targets.length === 0) throw new Error("No targets provided for selection");
        
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Candidates: ${targets.join(", ")}.
            User Context/Mandate: ${mandate}.
            
            Task: Pick the SINGLE best candidate that fits the user's current request.
            Return ONLY the company name.`
        });
        
        const text = response.text?.trim();
        if (!text) throw new Error("Empty selection response");
        return text;
    } catch (e) {
        throw new Error(`Target Selection Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * Scout/Analyst: Deep Dive with Gap Filling
 */
export const performDeepDive = async (companyName: string): Promise<{ text: string, sources: string[] }> => {
  try {
    const ai = getClient();
    // Use Pro for deep dive to ensure better reasoning when filling gaps
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a deep-dive investigation on: "${companyName}".
      
      SEARCH STRATEGY (Triangulation):
      1. Search for official financials (Revenue, EBITDA). 
      2. If private/missing, search for "Employee Count" (LinkedIn/Glassdoor) and "Funding History" (Crunchbase) to ESTIMATE revenue (e.g., ~$200k ARR per employee for SaaS).
      3. Identify top 3 competitors and their trading multiples.
      4. Find headquarters location.
      
      OUTPUT REQUIREMENT:
      - Synthesize a comprehensive profile.
      - If you Estimated numbers, explicitly state: "Estimated based on [Proxy]..."
      - Do not simply say "Data not found". Be an intelligent analyst and FILL THE GAPS with sector benchmarks.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter((uri: string) => !!uri) || [];

    return {
      text: response.text || "No specific data found.",
      sources: sources
    };
  } catch (error) {
     throw new Error(`Deep Dive Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Diligence Agent: Document Analysis
 */
export const analyzeDocument = async (files: FileAttachment[], prompt: string): Promise<Partial<DealData> & { summary: string }> => {
    try {
        const ai = getClient();
        const parts: any[] = [
            { text: `
                Act as a Private Equity Diligence Agent for DiDi AI.
                Analyze the provided document(s).
                User Context: "${prompt}"

                TASK:
                1. Extract key metrics (EBITDA, Revenue).
                2. If specific metrics are missing in the doc, INFER them from context or sector averages (e.g. if OpEx is listed, back into margins).
                3. Return a structured JSON object.
            ` }
        ];

        files.forEach(file => {
            const base64Data = file.data.split(',')[1]; 
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        companyName: { type: Type.STRING },
                        sector: { type: Type.STRING },
                        ebitda: { type: Type.NUMBER },
                        revenue: { type: Type.NUMBER },
                        askingMultiple: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        memo: {
                            type: Type.OBJECT,
                            properties: {
                                executiveSummary: { type: Type.STRING },
                                investmentThesis: { type: Type.ARRAY, items: { type: Type.STRING } },
                                keyRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                                marketOverview: { type: Type.STRING },
                                operationalUpside: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["companyName", "summary", "memo"]
                }
            }
        });

        const json = cleanAndParseJSON(response.text || "{}");
        if (!json.companyName) throw new Error("Failed to extract company name from document");
        
        return json;

    } catch (e) {
        throw new Error(`Document Analysis Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Diligence Agent: Portfolio Ingestion
 */
export const ingestPortfolioDocuments = async (files: FileAttachment[]): Promise<PortfolioCompany[]> => {
    try {
        const ai = getClient();
        const parts: any[] = [
            { text: `Act as a Private Equity Operations Agent for DiDi AI. Parse this portfolio data.` }
        ];

        files.forEach(file => {
            const base64Data = file.data.split(',')[1]; 
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            sector: { type: Type.STRING },
                            location: { type: Type.STRING },
                            investmentStatus: { type: Type.STRING, enum: ['Active', 'Exited', 'Watchlist'] },
                            revenue: { type: Type.NUMBER },
                            ebitda: { type: Type.NUMBER },
                            grossMargin: { type: Type.NUMBER },
                            entryDate: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "sector", "revenue", "ebitda"]
                    }
                }
            }
        });

        const json = cleanAndParseJSON(response.text || "[]");
        if (!Array.isArray(json)) throw new Error("Failed to parse portfolio array.");
        
        return json.map((company: any) => ({
            ...company,
            id: company.id || Math.random().toString(36).substring(7)
        }));

    } catch (e) {
        throw new Error(`Portfolio Ingestion Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Associate Agent: Financial Modeling & Memo (Intelligent Gap Filling)
 */
export const generateDealStructure = async (companyName: string, rawData: string, candidates: string[], portfolioContext?: PortfolioCompany[]): Promise<DealData> => {
  try {
    const ai = getClient();
    
    let contextPrompt = "";
    if (portfolioContext && portfolioContext.length > 0) {
        const similarPortcos = portfolioContext.slice(0, 3).map(p => `${p.name} (${p.sector}, ${p.ebitda}M EBITDA)`);
        contextPrompt = `\nCONTEXT - PORTFOLIO BENCHMARKS: ${similarPortcos.join(", ")}.`;
    }

    // Using Pro model for the massive context generation to prevent truncation and ensure quality
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create a detailed DiDi AI deal package for "${companyName}" based on: ${rawData}
      ${contextPrompt}
      
      INTELLIGENT MODELING INSTRUCTIONS:
      1. **FILL THE GAPS**: Private company data is often missing. You must ESTIMATE missing metrics (Margins, CapEx, Growth) based on Sector Benchmarks.
      2. **DO NOT RETURN ZEROS**: A model with all zeros is useless. Use industry standard assumptions if necessary and note them in the memo.
      3. **3-Statement Model**: Construct LTM + 5 Year Projections. EBITDA must mathematically flow from Revenue * Margin.
      4. **LBO Model**: Assume standard PE leverage (e.g. 4.0x-5.0x Senior, 1.0x Mezz). Calculate 5-year returns.
      5. **Investment Memo**: Professional, decisive, and explain *why* you made certain estimates.
      `,
      config: {
        // High token limit to allow full JSON generation without truncation
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            sector: { type: Type.STRING },
            ebitda: { type: Type.NUMBER },
            revenue: { type: Type.NUMBER },
            askingMultiple: { type: Type.NUMBER },
            impliedValue: { type: Type.NUMBER },
            
            financialModels: {
                type: Type.OBJECT,
                properties: {
                    years: { type: Type.ARRAY, items: { type: Type.STRING } },
                    incomeStatement: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            rows: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT, 
                                    properties: {
                                        label: { type: Type.STRING },
                                        values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                                    }
                                } 
                            }
                        }
                    },
                    balanceSheet: {
                         type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            rows: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT, 
                                    properties: {
                                        label: { type: Type.STRING },
                                        values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                                    }
                                } 
                            }
                        }
                    },
                    cashFlow: {
                         type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            rows: { 
                                type: Type.ARRAY, 
                                items: { 
                                    type: Type.OBJECT, 
                                    properties: {
                                        label: { type: Type.STRING },
                                        values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                                    }
                                } 
                            }
                        }
                    }
                }
            },

            lboModel: {
              type: Type.OBJECT,
              properties: {
                entryMultiple: { type: Type.NUMBER },
                exitMultiple: { type: Type.NUMBER },
                irr: { type: Type.NUMBER },
                moic: { type: Type.NUMBER },
                debttoEquity: { type: Type.NUMBER }
              }
            },
            
            lboDetailed: {
                type: Type.OBJECT,
                properties: {
                    assumptions: {
                        type: Type.ARRAY,
                        items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } }
                    },
                    sources: {
                        type: Type.ARRAY,
                        items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                    },
                    uses: {
                        type: Type.ARRAY,
                        items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                    },
                    debtSchedule: {
                         type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            rows: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, values: { type: Type.ARRAY, items: { type: Type.NUMBER } } } } }
                        }
                    },
                    projectedReturns: {
                         type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            rows: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, values: { type: Type.ARRAY, items: { type: Type.NUMBER } } } } }
                        }
                    }
                }
            },

            memo: {
                type: Type.OBJECT,
                properties: {
                    executiveSummary: { type: Type.STRING },
                    investmentRecommendation: { type: Type.STRING, enum: ["GO", "NO-GO", "HOLD"] },
                    recommendationRationale: { type: Type.STRING },
                    dealMerits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    investmentThesis: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    riskMitigation: { type: Type.STRING },
                    marketOverview: { type: Type.STRING },
                    competitiveLandscape: { type: Type.STRING },
                    customerAnalysis: { type: Type.STRING },
                    operationalUpside: { type: Type.STRING }
                }
            },
            sensitivityAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        entryMultiple: { type: Type.NUMBER },
                        exits: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    multiple: { type: Type.NUMBER },
                                    irr: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            },
            comparables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  multiple: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["companyName", "ebitda", "lboModel", "lboDetailed", "memo", "financialModels"]
        }
      }
    });

    const rawJSON = cleanAndParseJSON(response.text || "{}");
    const data = sanitizeDealData(rawJSON, companyName);
    
    data.candidatesAnalyzed = candidates;
    return data;
  } catch (error) {
    throw new Error(`Structure Generation Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * VP Agent (Image Gen)
 */
export const generateConceptImage = async (prompt: string): Promise<string | null> => {
  const ai = getClient();
  const parts = [{ text: `A professional, modern, corporate logo for: ${prompt}. Minimalist, high fidelity, 4k, white on dark background. Brand palette: Black and Gold.` }];
  
  const generateWithModel = async (model: string, useAdvancedConfig: boolean) => {
    const config: any = {
        imageConfig: { aspectRatio: "1:1" }
    };
    if (useAdvancedConfig) {
        config.imageConfig.imageSize = "1K";
    }

    return await ai.models.generateContent({
        model,
        contents: { parts },
        config
    });
  };

  try {
    const response = await generateWithModel('gemini-3-pro-image-preview', true);
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.warn(`Primary image model failed: ${error.message}`);
    // Fallback logic
    if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('Quota')) {
        try {
            const fallbackResponse = await generateWithModel('gemini-2.5-flash-image', false);
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        } catch (fallbackError) {
            console.error("Fallback image model also failed", fallbackError);
        }
    }
    return null;
  }
};

/**
 * Maps Agent
 */
export const verifyLocation = async (locationQuery: string): Promise<string[]> => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Where is the headquarters of ${locationQuery}? provide exact address if possible.`,
            config: {
                tools: [{ googleMaps: {} }]
            }
        });
        
        const mapLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.maps?.uri)
            .filter((uri: string) => !!uri) || [];

        return mapLinks;
    } catch (e) {
        throw new Error(`Location Verification Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * MD Agent: Final Opinion
 */
export const getMDFinalOpinion = async (dealData: DealData, mandate: string, originalPrompt: string): Promise<string> => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `
            Original Request: "${originalPrompt}"
            Firm Mandate: "${mandate}"
            Target Selected: "${dealData.companyName}" 
            Financials: EBITDA $${dealData.ebitda}M, IRR ${dealData.lboModel?.irr}%.
            
            Write a final Investment Committee opinion for DiDi AI.
            Be decisive. Use bold formatting.
            `,
            config: {
               thinkingConfig: { thinkingBudget: 1024 }
            }
        });
        if (!response.text) throw new Error("No opinion generated");
        return response.text;
    } catch (e) {
        throw new Error(`Opinion Generation Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * Design Agent: Generate Deliverable Structure
 */
export const generateDeliverableContent = async (dealData: DealData, type: DeliverableType): Promise<Slide[]> => {
    try {
        const ai = getClient();
        const pageLimit = type === 'Teaser' || type === 'One Pager' ? 3 : 10;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                Act as a DiDi AI Investment Banking Associate.
                Create a slide outline for a "${type}" document for "${dealData.companyName}".
                
                REQUIREMENTS:
                - Max ${pageLimit} slides.
                - Slide 1 must be the Title Slide.
                - Visual Directive: Describe specific charts (e.g. "Waterfall chart of synergies", "Bar chart of Revenue Growth").
                
                Return JSON.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            contentPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                            visualDirective: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const json = cleanAndParseJSON(response.text || "[]");
        return json as Slide[];
    } catch (e) {
        throw new Error(`Deliverable Content Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Design Agent: Render Slide Visual
 */
export const generateSlideDesign = async (slide: Slide, companyName: string): Promise<string | null> => {
    const ai = getClient();
    const parts = [{ text: `
        ROLE: Expert Presentation Designer for DiDi AI.
        TASK: Create a high-fidelity 16:9 DIGITAL SLIDE EXPORT.
        
        Subject: ${companyName} - ${slide.title}
        Visual Instructions: ${slide.visualDirective}
        
        STYLE:
        - Brand: DiDi AI (Black, Gold, White). Ultra-modern.
        - Format: Digital Slide (NOT a photo of a screen).
        - No competitor names (Goldman, McKinsey).
        - Use clean, professional charts.
    `}];

    const generateWithModel = async (model: string, useAdvancedConfig: boolean) => {
        const config: any = {
            imageConfig: { aspectRatio: "16:9" }
        };
        // imageSize is only supported by gemini-3-pro-image-preview
        if (useAdvancedConfig) {
            config.imageConfig.imageSize = "1K";
        }

        return await ai.models.generateContent({
            model,
            contents: { parts },
            config
        });
    };

    try {
        const response = await generateWithModel('gemini-3-pro-image-preview', true);
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e: any) {
        console.warn(`Primary image model failed: ${e.message}`);
        if (e.message?.includes('403') || e.message?.includes('PERMISSION_DENIED') || e.message?.includes('Quota')) {
            try {
                // Use Flash model WITHOUT imageSize parameter
                const fallbackResponse = await generateWithModel('gemini-2.5-flash-image', false);
                for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            } catch (fallbackError) {
                console.error("Fallback image model also failed", fallbackError);
            }
        }
        return null; 
    }
};