import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CadastralData {
  cadastralNumber: string;
  pointsCount: number;
  area: number;
  cadastralCost: number;
  category: string;
  address: string;
}

const Index = () => {
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [pointsCount, setPointsCount] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cadastralData, setCadastralData] = useState<CadastralData | null>(null);

  const pricePerPoint = 1000;

  const handleCalculate = async () => {
    setIsLoading(true);
    setError('');
    setIsCalculated(false);

    try {
      const response = await fetch(
        `https://functions.poehali.dev/88b420f9-0d05-40b4-9a44-9cc51ac92076?cadastralNumber=${encodeURIComponent(cadastralNumber)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при получении данных');
      }

      const data: CadastralData = await response.json();
      setCadastralData(data);
      setPointsCount(data.pointsCount);
      setIsCalculated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Участок не найден');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = pointsCount * pricePerPoint;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Калькулятор стоимости
          </h1>
          <p className="text-xl text-muted-foreground">
            Расчёт стоимости выноса границ земельного участка
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="animate-scale-in shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Icon name="Calculator" className="text-primary" size={28} />
                Ввод данных
              </CardTitle>
              <CardDescription>
                Введите кадастровый номер участка для расчёта стоимости
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cadastral" className="text-base font-medium">
                  Кадастровый номер
                </Label>
                <Input
                  id="cadastral"
                  placeholder="77:01:0001001:1234"
                  value={cadastralNumber}
                  onChange={(e) => setCadastralNumber(e.target.value)}
                  className="text-lg h-12 border-2 focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border-2 border-muted">
                <div className="flex items-start gap-3">
                  <Icon name="Info" className="text-primary flex-shrink-0 mt-1" size={20} />
                  <p className="text-sm text-muted-foreground">
                    Количество точек определяется автоматически на основе данных кадастровой карты
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertCircle" className="text-destructive flex-shrink-0 mt-1" size={20} />
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCalculate}
                disabled={!cadastralNumber || isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-50"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                    Получение данных...
                  </>
                ) : (
                  <>
                    <Icon name="Search" className="mr-2" size={20} />
                    Рассчитать стоимость
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-scale-in shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300 animation-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Icon name="TrendingUp" className="text-secondary" size={28} />
                Результат расчёта
              </CardTitle>
              <CardDescription>
                Детализация стоимости выноса границ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isCalculated ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-full mb-6">
                    <Icon name="MapPin" className="text-primary" size={64} />
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Введите кадастровый номер и нажмите "Рассчитать"
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-xl border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground font-medium">Участок:</span>
                      <span className="font-mono font-semibold">{cadastralNumber}</span>
                    </div>
                    {cadastralData?.address && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground font-medium">Адрес:</span>
                        <span className="text-sm">{cadastralData.address}</span>
                      </div>
                    )}
                    {cadastralData?.area && cadastralData.area > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground font-medium">Площадь:</span>
                        <span className="font-semibold">{cadastralData.area.toLocaleString('ru-RU')} м²</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground font-medium">Количество точек:</span>
                      <span className="text-2xl font-bold text-primary">{pointsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Цена за точку:</span>
                      <span className="font-semibold">{formatCurrency(pricePerPoint)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-accent via-secondary to-primary p-8 rounded-xl text-white shadow-lg">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2 opacity-90">Итоговая стоимость</p>
                      <p className="text-5xl font-bold mb-1">{formatCurrency(totalCost)}</p>
                      <p className="text-sm opacity-75">({pointsCount} × {formatCurrency(pricePerPoint)})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(pointsCount)].slice(0, 12).map((_, i) => (
                      <div
                        key={i}
                        className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3 flex items-center justify-center animate-scale-in"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <Icon name="MapPin" className="text-primary mr-2" size={16} />
                        <span className="font-mono text-sm font-semibold">{i + 1}</span>
                      </div>
                    ))}
                    {pointsCount > 12 && (
                      <div className="bg-muted/50 border-2 border-muted rounded-lg p-3 flex items-center justify-center">
                        <span className="text-muted-foreground font-semibold">+{pointsCount - 12}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white p-3 rounded-lg">
                  <Icon name="Clock" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Быстрый расчёт</h3>
                  <p className="text-sm text-muted-foreground">
                    Автоматическое определение точек по кадастровой карте
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-secondary text-white p-3 rounded-lg">
                  <Icon name="Shield" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Точность</h3>
                  <p className="text-sm text-muted-foreground">
                    Данные синхронизированы с официальными источниками
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-accent text-white p-3 rounded-lg">
                  <Icon name="FileText" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Прозрачность</h3>
                  <p className="text-sm text-muted-foreground">
                    Детальная разбивка по всем точкам границы
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;