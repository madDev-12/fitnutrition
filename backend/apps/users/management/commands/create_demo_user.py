"""
Django管理コマンド: デモユーザー作成
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile, FoodPreference
from apps.measurements.models import BodyMeasurement
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'デモユーザーとサンプルデータを作成'

    def handle(self, *args, **options):
        # 既存のデモユーザーを削除
        User.objects.filter(email='demo@fitnutrition.com').delete()
        
        self.stdout.write("デモユーザーを作成中...")
        
        # デモユーザー作成
        demo_user = User.objects.create_user(
            username='demo_user',
            email='demo@fitnutrition.com',
            password='demo123456',
            first_name='太郎',
            last_name='山田',
            date_of_birth=date(1990, 1, 1)
        )
        self.stdout.write(self.style.SUCCESS(f"✅ ユーザー作成完了: {demo_user.email}"))
        
        # ユーザープロフィール作成
        profile = UserProfile.objects.create(
            user=demo_user,
            gender='male',
            height=175.0,
            current_weight=75.0,
            target_weight=70.0,
            activity_level='moderate',
            fitness_goal='weight_loss',
            body_fat_percentage=20.0,
            chest=95.0,
            waist=85.0,
            hips=95.0,
            arms=32.0,
            thighs=55.0,
            calves=38.0
        )
        self.stdout.write(self.style.SUCCESS(
            f"✅ プロフィール作成完了: BMI={profile.bmi:.1f}, TDEE={profile.tdee:.0f}kcal"
        ))
        
        # 食事の好み作成
        food_pref = FoodPreference.objects.create(
            user=demo_user,
            diet_type='omnivore',
            allergies='なし',
            dislikes='セロリ、パクチー',
            preferred_foods='鶏肉、魚、野菜、果物',
            avoid_ingredients='人工甘味料'
        )
        self.stdout.write(self.style.SUCCESS(f"✅ 食事の好み作成完了: {food_pref.diet_type}"))
        
        # サンプル測定データ作成（過去30日分）
        self.stdout.write("サンプル測定データを作成中...")
        today = date.today()
        for i in range(30, 0, -1):
            measurement_date = today - timedelta(days=i)
            weight = 75.0 + (i * 0.1)  # 徐々に減量
            
            BodyMeasurement.objects.create(
                user=demo_user,
                date=measurement_date,
                weight=weight,
                height=175.0,
                body_fat_percentage=20.0 + (i * 0.05),
                muscle_mass=55.0 - (i * 0.03),
                chest=95.0,
                waist=85.0 - (i * 0.1),
                hips=95.0,
                arms_left=32.0,
                arms_right=32.0,
                thighs_left=55.0,
                thighs_right=55.0,
                calves_left=38.0,
                calves_right=38.0,
                notes=f'{i}日前の測定' if i > 1 else '今日の測定'
            )
        
        self.stdout.write(self.style.SUCCESS("✅ 30日分の測定データ作成完了"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("🎉 デモユーザー作成完了！"))
        self.stdout.write("="*60)
        self.stdout.write("\nログイン情報:")
        self.stdout.write(f"  メールアドレス: {demo_user.email}")
        self.stdout.write(f"  パスワード: demo123456")
        self.stdout.write(f"\nユーザー情報:")
        self.stdout.write(f"  名前: {demo_user.last_name} {demo_user.first_name}")
        self.stdout.write(f"  年齢: {demo_user.age}歳")
        self.stdout.write(f"  身長: {profile.height}cm")
        self.stdout.write(f"  現在の体重: {profile.current_weight}kg")
        self.stdout.write(f"  目標体重: {profile.target_weight}kg")
        self.stdout.write(f"  BMI: {profile.bmi:.1f}")
        self.stdout.write(f"  TDEE: {profile.tdee:.0f}kcal/日")
        self.stdout.write(f"  目標カロリー: {profile.daily_calorie_target:.0f}kcal/日")
        self.stdout.write("\n" + "="*60)
