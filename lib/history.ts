import type { AnalysisRecord, AnalysisResult, AnalyzeRequest } from "@/types";
import { extractTitle } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export async function saveAnalysis(
  req: AnalyzeRequest,
  result: AnalysisResult,
  userId: string
): Promise<AnalysisRecord | null> {
  const supabase = await createClient();

  const record: Omit<AnalysisRecord, "id" | "createdAt" | "updatedAt"> = {
    userId,
    title: extractTitle(req.code, req.fileName),
    originalCode: req.code,
    errorMessage: req.errorMessage,
    language: result.language,
    result,
    analysisType: req.analysisType,
  };

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: record.userId,
      title: record.title,
      original_code: record.originalCode,
      error_message: record.errorMessage,
      language: record.language,
      result: record.result,
      analysis_type: record.analysisType,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save analysis:", error.message);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    originalCode: data.original_code,
    errorMessage: data.error_message,
    language: data.language,
    result: data.result,
    analysisType: data.analysis_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getHistory(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ records: AnalysisRecord[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("analyses")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const records: AnalysisRecord[] = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    originalCode: row.original_code,
    errorMessage: row.error_message,
    language: row.language,
    result: row.result,
    analysisType: row.analysis_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { records, total: count ?? 0 };
}

export async function deleteAnalysis(id: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
