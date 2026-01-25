import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface ReviewImporterProps {
    onBack: () => void;
}

export const ReviewImporter = ({ onBack }: ReviewImporterProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{ success: number; errors: number } | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            setError('');
            setResults(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setImporting(true);
        setProgress(0);
        setError('');

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const rows = results.data as any[];
                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];

                    // Skip empty rows
                    if (!row.customer_name || !row.rating || !row.review_text) {
                        continue;
                    }

                    try {
                        // Determine if it's a general review
                        const isGeneral = !row.product_id || row.product_id.trim() === '' || row.is_general === 'true';

                        // Find product by ID or SKU if not general
                        let productId = null;
                        if (!isGeneral && row.product_id) {
                            // Try to find product by slug (since that's what users might export)
                            const { data: product } = await supabase
                                .from('products')
                                .select('id')
                                .eq('slug', row.product_id)
                                .single();

                            productId = product?.id || null;
                        }

                        // Parse date
                        let reviewedAt = new Date().toISOString();
                        if (row.date || row.reviewed_at || row.created_at) {
                            const dateStr = row.date || row.reviewed_at || row.created_at;
                            const parsedDate = new Date(dateStr);
                            if (!isNaN(parsedDate.getTime())) {
                                reviewedAt = parsedDate.toISOString();
                            }
                        }

                        // Insert review
                        const { error: insertError } = await supabase
                            .from('reviews')
                            .insert({
                                product_id: productId,
                                customer_name: row.customer_name?.trim(),
                                customer_email: row.customer_email?.trim() || 'imported@review.com',
                                rating: parseInt(row.rating),
                                title: row.title?.trim() || null,
                                review_text: row.review_text?.trim(),
                                is_verified_buyer: row.verified_buyer === 'true' || row.is_verified_buyer === 'true',
                                status: 'approved', // Auto-approve imports
                                reviewed_at: reviewedAt
                            });

                        if (insertError) throw insertError;
                        successCount++;
                    } catch (err) {
                        console.error('Error importing review:', err);
                        errorCount++;
                    }

                    setProgress(Math.round(((i + 1) / rows.length) * 100));
                }

                setResults({ success: successCount, errors: errorCount });
                setImporting(false);
            },
            error: (error) => {
                setError(`Failed to parse CSV: ${error.message}`);
                setImporting(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-900/10 to-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-urbanist"
                    >
                        <ArrowLeft size={20} />
                        Back to Reviews
                    </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-8">
                    <h2 className="text-2xl font-cinzel text-white mb-4">Import Reviews from CSV</h2>
                    <p className="text-gray-400 font-urbanist mb-6">
                        Upload your exported reviews from Fera or another platform. The importer will automatically detect product reviews vs general testimonials.
                    </p>

                    {/* CSV Format Guide */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <h3 className="text-blue-400 font-urbanist font-bold mb-2">Expected CSV Format:</h3>
                        <div className="text-sm text-gray-400 font-mono">
                            customer_name, customer_email, rating, title, review_text, product_id, date, verified_buyer
                        </div>
                        <ul className="text-sm text-gray-400 font-urbanist mt-3 space-y-1">
                            <li>• <strong>product_id</strong>: Leave empty for general testimonials, use product slug for product reviews</li>
                            <li>• <strong>rating</strong>: 1-5 (required)</li>
                            <li>• <strong>date</strong>: Any standard date format (optional, uses current date if missing)</li>
                            <li>• <strong>verified_buyer</strong>: true/false (optional)</li>
                        </ul>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm text-white/60 uppercase tracking-wider mb-3 font-urbanist">
                            Select CSV File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={importing}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className={`flex items-center justify-center gap-3 w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${file
                                        ? 'border-green-500/50 bg-green-500/10'
                                        : 'border-white/20 hover:border-purple-500/50 bg-white/5'
                                    } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {file ? (
                                    <>
                                        <FileText className="text-green-400" size={24} />
                                        <span className="text-green-400 font-urbanist">{file.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400" size={24} />
                                        <span className="text-gray-400 font-urbanist">Click to select CSV file</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Import Button */}
                    {file && !results && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-urbanist font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? `Importing... ${progress}%` : 'Import Reviews'}
                        </button>
                    )}

                    {/* Progress */}
                    {importing && (
                        <div className="mt-4">
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <AlertCircle size={20} />
                            <span className="font-urbanist">{error}</span>
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="text-green-400" size={24} />
                                <h3 className="text-green-400 font-urbanist font-bold text-lg">Import Complete!</h3>
                            </div>
                            <div className="space-y-2 text-gray-300 font-urbanist">
                                <div>✅ Successfully imported: <strong>{results.success}</strong> reviews</div>
                                {results.errors > 0 && (
                                    <div>⚠️ Failed to import: <strong>{results.errors}</strong> reviews</div>
                                )}
                            </div>
                            <button
                                onClick={onBack}
                                className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-urbanist font-bold rounded-lg transition-all"
                            >
                                View Imported Reviews
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewImporter;
